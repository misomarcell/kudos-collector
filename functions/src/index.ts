import { App, ExpressReceiver, LogLevel } from "@slack/bolt";
import { firestore } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { FieldValue } from "firebase-admin/firestore";
import { config, logger, region } from "firebase-functions";

import { Kudos, KudosUser } from "./kudos.model";

const app = initializeApp();
const logLevel = LogLevel.WARN;
const loggerAdapter = {
	debug: (...msgs: any) => {
		logger.debug(msgs);
	},
	info: (...msgs: any) => {
		logger.info(msgs);
	},
	warn: (...msgs: any) => {
		logger.warn(msgs);
	},
	error: (...msgs: any) => {
		logger.error(msgs);
	},
	setLevel: () => {},
	getLevel: () => logLevel,
	setName: () => {}
};

const receiver = new ExpressReceiver({
	processBeforeResponse: true,
	signingSecret: config().slack.signing_secret,
	logLevel: logLevel,
	logger: loggerAdapter,
	endpoints: {
		events: "/events",
		commands: "/command"
	}
});

const boltApp = new App({
	receiver,
	signingSecret: config().slack.signing_secret,
	token: config().slack.token
});

boltApp.error(async (error: any) => {
	logger.error(error);
});

boltApp.event("reaction_added", async ({ event, say }) => {
	if (event.user === event.item_user) {
		return;
	}

	const fromUser = await getKudosUser(event.user);
	const toUser = await getKudosUser(event.item_user);
	const kudosCount = await getUserKudosCount(toUser.id);

	await saveKudos({
		from: fromUser,
		to: toUser,
		item: event.item,
		timestamp: FieldValue.serverTimestamp()
	});

	await boltApp.client.chat.postMessage({
		channel: fromUser.id,
		text: `You just gave a kudos to <@${toUser.id}> who now has ${(kudosCount || 0) + 1}.`
	});
});

boltApp.command("/stats", async ({ command, ack, respond }) => {
	const kudosCount = await getUserKudosCount(command.user_id);
	await ack(`You currently have ${kudosCount} kudos`);
});

async function saveKudos(kudos: Kudos) {
	const teamId = await getTeamId();
	if (!teamId) return;

	logger.log("Adding item to database ", { kudos });
	await firestore(app).collection("teams").doc(teamId).collection("kudos").add(kudos);
}

async function getKudosUser(userId: string): Promise<KudosUser> {
	const user = await boltApp.client.users.profile.get({ user: userId });

	return {
		id: userId,
		name: user.profile?.display_name || user.profile?.real_name || "Anonymus"
	};
}

async function getUserKudosCount(userId: string): Promise<number | undefined> {
	const teamId = await getTeamId();
	if (!teamId) return;

	const kudos = firestore().collection("teams").doc(teamId).collection("kudos").where("to.id", "==", userId);
	const count = await kudos.count().get();

	return count.data().count;
}

async function getTeamId(): Promise<string | undefined> {
	const teamInfo = await boltApp.client.team.info();
	return teamInfo.team?.id;
}

export const slack = region("europe-west1").https.onRequest((req, res) => {
	if (req.headers["x-slack-retry-num"] || req.headers["X-Slack-Retry-Num"]) {
		res.send(JSON.stringify({ message: "No need to resend" }));
		return;
	}

	receiver.app(req, res);
});
