import { ReactionFileCommentItem, ReactionFileItem, ReactionMessageItem } from "@slack/bolt";
import { firestore } from "firebase-admin";

export interface Kudos {
	from: KudosUser;
	to: KudosUser;
	item: ReactionMessageItem | ReactionFileItem | ReactionFileCommentItem;
	timestamp: firestore.FieldValue;
}

export interface KudosUser {
	id: string;
	name: string;
}
