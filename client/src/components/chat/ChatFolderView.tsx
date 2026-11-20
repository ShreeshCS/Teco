import { useState } from "react";
import type { Conversation } from "@/types/chat.types";
import type { FriendUser } from "@/types/friend.types";
import { ChatIcon, SearchIcon, UsersIcon } from "./RetroIcons";

interface ChatFolderViewProps {
	conversations: Conversation[];
	friends: FriendUser[];
	onSelectConversation: (conversationId: string, name?: string) => void;
	onStartChatWithFriend: (friend: FriendUser) => void;
}

export default function ChatFolderView({
	conversations,
	friends,
	onSelectConversation,
	onStartChatWithFriend,
}: ChatFolderViewProps) {
	const [activeSubTab, setActiveSubTab] = useState<"recent" | "friends">("recent");
	const [friendSearch, setFriendSearch] = useState("");

	const filteredFriends = friends.filter((friend) =>
		`${friend.name} ${friend.email}`
			.toLowerCase()
			.includes(friendSearch.toLowerCase()),
	);

	return (
		<div className="retro-folder-container">
			<div className="folder-tabs-header">
				<div className="folder-tab-ear active">
					<ChatIcon />
					<span className="ear-label">Chat</span>
				</div>
			</div>

			<div className="folder-body-card folder-body-card--with-nav">
				<div className="folder-subsections-nav">
					<button
						type="button"
						className={`sub-nav-btn ${activeSubTab === "recent" ? "active" : ""}`}
						onClick={() => setActiveSubTab("recent")}
					>
						<ChatIcon />
						<span>Recent conversations</span>
						<span className="badge-count">{conversations.length}</span>
					</button>
					<button
						type="button"
						className={`sub-nav-btn ${activeSubTab === "friends" ? "active" : ""}`}
						onClick={() => setActiveSubTab("friends")}
					>
						<UsersIcon />
						<span>Start a chat</span>
						<span className="badge-count">{friends.length}</span>
					</button>
				</div>

				{activeSubTab === "recent" && (
					<div className="subsection-pane">
						<div className="subsection-banner">
							<h3 className="pane-title">YOUR CONVERSATIONS</h3>
							<p className="pane-desc">
								Conversations and messages saved to your account.
							</p>
						</div>
						{conversations.length === 0 ? (
							<div className="empty-sub-state">
								<p className="empty-title">No conversations yet</p>
								<p className="empty-desc">
									Choose a friend to start a conversation.
								</p>
							</div>
						) : (
							<div className="friend-chats-list">
								{conversations.map((conversation) => (
									<button
										type="button"
										key={conversation.id}
										className="friend-chat-row"
										onClick={() =>
											onSelectConversation(
												conversation.id,
												conversation.withUserName,
											)
										}
									>
										<div className="friend-avatar-circle">
											{conversation.withUserName.charAt(0).toUpperCase()}
										</div>
										<div className="friend-info">
											<div className="friend-top-row">
												<span className="friend-name">
													{conversation.withUserName}
												</span>
											</div>
											<span className="friend-preview">
												{conversation.messagePreview || "No messages yet"}
											</span>
										</div>
										<span aria-hidden="true">Open →</span>
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{activeSubTab === "friends" && (
					<div className="subsection-pane">
						<div className="subsection-banner">
							<div className="banner-left">
								<h3 className="pane-title">CHAT WITH A FRIEND</h3>
								<p className="pane-desc">
									Select a friend to open or create your private conversation.
								</p>
							</div>
							<div className="search-input-wrapper">
								<SearchIcon />
								<input
									type="text"
									placeholder="Filter friends..."
									value={friendSearch}
									onChange={(event) => setFriendSearch(event.target.value)}
									className="retro-search-input"
								/>
							</div>
						</div>
						{friends.length === 0 ? (
							<div className="empty-sub-state">
								<p className="empty-title">No friends yet</p>
								<p className="empty-desc">
									Add a friend from the Friends folder before starting a chat.
								</p>
							</div>
						) : filteredFriends.length === 0 ? (
							<div className="empty-sub-state">
								<p className="empty-title">No matching friends</p>
							</div>
						) : (
							<div className="friend-chats-list">
								{filteredFriends.map((friend) => (
									<button
										type="button"
										key={friend.id}
										className="friend-chat-row"
										onClick={() => onStartChatWithFriend(friend)}
									>
										<div className="friend-avatar-circle">
											{friend.name.charAt(0).toUpperCase()}
										</div>
										<div className="friend-info">
											<div className="friend-top-row">
												<span className="friend-name">{friend.name}</span>
											</div>
											<span className="friend-preview">{friend.email}</span>
										</div>
										<span>Chat →</span>
									</button>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
