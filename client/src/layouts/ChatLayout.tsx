import { useState, useEffect } from "react";
import TecoLogo from "../assets/Teco_Logo.png";
import "./ChatLayout.scss";
import "./GroupChat.scss";
import { useAuth } from "../hooks/useAuth";
import type { ChatGroup, ChatMessage, Conversation } from "../types/chat.types";
import type { FriendUser, FriendRequestItem } from "../types/friend.types";
import { chatService, friendService, groupService } from "@/services";

import {
	ProfileIcon,
	BellIcon,
	SearchIcon,
	ChatIcon,
	UsersIcon,
	LogoutIcon,
} from "../components/chat/RetroIcons";
import NotificationDropdown from "../components/chat/NotificationDropdown";
import ChatFolderView from "../components/chat/ChatFolderView";
import FriendsFolderView from "../components/chat/FriendsFolderView";
import ProfileFolderView from "../components/chat/ProfileFolderView";
import ActiveChatView from "../components/chat/ActiveChatView";
import GroupsFolderView from "../components/chat/GroupsFolderView";
import GroupManagementModal from "../components/chat/GroupManagementModal";

interface ChatLayoutProps {
	isDark: boolean;
	onToggleTheme: () => void;
}

export default function ChatLayout({ isDark, onToggleTheme }: ChatLayoutProps) {
	const { signOut, user } = useAuth();

	// No folder is selected until the user opens one.
	const [activeTab, setActiveTab] = useState<"friends" | "profile" | "chat" | null>(null);
	const [activeChatSection, setActiveChatSection] = useState<"chats" | "groups">("chats");

	// Active selected conversation
	const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
	const [selectedContactName, setSelectedContactName] = useState<string>("Chat Room");
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [groupModal, setGroupModal] = useState<ChatGroup | null | undefined>(undefined);

	const [searchQuery, setSearchQuery] = useState("");

	// Data states
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [groups, setGroups] = useState<ChatGroup[]>([]);
	const [friends, setFriends] = useState<FriendUser[]>([]);
	const [pendingRequests, setPendingRequests] = useState<FriendRequestItem[]>([]);
	const [dataError, setDataError] = useState<string | null>(null);
	const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

	// Notification popover state
	const [isNotifOpen, setIsNotifOpen] = useState(false);

	// Load all social data for the signed-in user from the backend.
	useEffect(() => {
		let isActive = true;
		if (!user?.id) return () => {
			isActive = false;
		};

		void Promise.allSettled([
			chatService.getConversationList(),
			friendService.getFriendsList(),
			friendService.getPendingRequests(),
			groupService.getGroups(),
		]).then(([conversationResult, friendResult, requestResult, groupResult]) => {
			if (!isActive) return;
			const errors: string[] = [];
			setDataError(null);

			if (conversationResult.status === "fulfilled") {
				setConversations(conversationResult.value);
			} else {
				setConversations([]);
				errors.push("Unable to load conversations.");
			}

			if (friendResult.status === "fulfilled") {
				setFriends(friendResult.value);
			} else {
				setFriends([]);
				errors.push("Unable to load friends.");
			}

			if (requestResult.status === "fulfilled") {
				setPendingRequests(requestResult.value);
			} else {
				setPendingRequests([]);
				errors.push("Unable to load friend requests.");
			}
			if (groupResult.status === "fulfilled") {
				setGroups(groupResult.value);
			} else {
				setGroups([]);
				errors.push("Unable to load groups.");
			}

			setDataError(errors.length > 0 ? errors.join(" ") : null);
			setLoadedUserId(user.id);
		});

		return () => { isActive = false; };
	}, [user?.id]);

	const hasLoadedSocialData = !!user?.id && loadedUserId === user.id;
	const visibleConversations = hasLoadedSocialData ? conversations : [];
	const visibleGroups = hasLoadedSocialData ? groups : [];
	const visibleFriends = hasLoadedSocialData ? friends : [];
	const visiblePendingRequests = hasLoadedSocialData ? pendingRequests : [];

	// Handler: Send Friend Request
	const handleSendFriendRequest = async (receiverId: string): Promise<boolean> => {
		try {
			await friendService.sendFriendRequest(receiverId);
			return true;
		} catch (err) {
			console.error("Failed to send friend request:", err);
			throw err;
		}
	};

	// Handler: Accept Friend Request
	const handleAcceptFriendRequest = async (requestId: string) => {
		try {
			await friendService.acceptFriendRequest(requestId);
			setPendingRequests((previous) =>
				previous.filter((request) => request.id !== requestId),
			);
			const [friendResult, requestResult] = await Promise.allSettled([
				friendService.getFriendsList(),
				friendService.getPendingRequests(),
			]);
			const errors: string[] = [];
			if (friendResult.status === "fulfilled") {
				setFriends(friendResult.value);
			} else {
				errors.push("Request accepted, but friends could not be refreshed.");
			}
			if (requestResult.status === "fulfilled") {
				setPendingRequests(requestResult.value);
			} else {
				errors.push("Request accepted, but requests could not be refreshed.");
			}
			setDataError(errors.length > 0 ? errors.join(" ") : null);
		} catch (err) {
			setDataError(
				err instanceof Error
					? err.message
					: "Unable to accept friend request.",
			);
		}
	};

	const handleDeclineFriendRequest = async (requestId: string) => {
		try {
			await friendService.declineFriendRequest(requestId);
			setPendingRequests((prev) => prev.filter((request) => request.id !== requestId));
			setDataError(null);
		} catch (err) {
			setDataError(
				err instanceof Error
					? err.message
					: "Unable to decline friend request.",
			);
		}
	};

	// Create or open a persisted direct conversation with an accepted friend.
	const handleStartChatWithFriend = async (friend: FriendUser) => {
		const existing = conversations.find((c) => c.withUserId === friend.id);
		try {
			const conversation =
				existing || (await chatService.createConversation(friend.id));
			const conversationId = conversation.id;
			setSelectedConversationId(conversationId);
			setSelectedGroupId(null);
			setActiveTab("chat");
			setActiveChatSection("chats");
			setSelectedContactName(friend.name);
			if (!existing) {
				setConversations((previous) => [
					{
						id: conversationId,
						messagePreview: "",
						withUserId: friend.id,
						withUserName: friend.name,
					},
					...previous,
				]);
			}
			setDataError(null);
		} catch (err) {
			setDataError(
				err instanceof Error ? err.message : "Unable to open conversation.",
			);
		}
	};

	// Select a conversation from sidebar or list
	const handleSelectConversation = (convId: string, name?: string) => {
		setSelectedConversationId(convId);
		setSelectedGroupId(null);
		setActiveTab("chat");
		setActiveChatSection("chats");
		if (name) {
			setSelectedContactName(name);
		} else {
			const conv = conversations.find((c) => c.id === convId);
			if (conv) {
				setSelectedContactName(conv.withUserName);
			}
		}
	};

	// Close active chat
	const handleCloseChat = () => {
		setSelectedConversationId(null);
		setSelectedGroupId(null);
	};

	const handleSelectGroup = (group: ChatGroup) => {
		setSelectedConversationId(group.id);
		setSelectedGroupId(group.id);
		setSelectedContactName(group.name ?? "Group chat");
		setActiveChatSection("groups");
		setActiveTab("chat");
	};

	const handleGroupSaved = (groupId?: string) => {
		setGroupModal(undefined);
		void groupService.getGroups().then((updatedGroups) => {
			setGroups(updatedGroups);
			if (groupId) {
				const updatedGroup = updatedGroups.find((group) => group.id === groupId);
				if (updatedGroup) handleSelectGroup(updatedGroup);
			} else {
				setSelectedConversationId(null);
				setSelectedGroupId(null);
			}
		}).catch((error: unknown) => {
			setDataError(error instanceof Error ? error.message : "Unable to refresh groups.");
		});
	};

	const handleChatMessageReceived = (message: ChatMessage) => {
		if (selectedGroupId) {
			setGroups((previous) => previous.map((group) =>
				group.id === selectedGroupId
					? { ...group, messages: [{ content: message.content, createdAt: message.createdAt }] }
					: group,
			));
			return;
		}
		setConversations((previous) => {
			const conversation = previous.find(
				(item) => item.id === selectedConversationId,
			);
			if (!conversation) return previous;
			return [
				{ ...conversation, messagePreview: message.content },
				...previous.filter((item) => item.id !== conversation.id),
			];
		});
	};

	// Filtered sidebar conversations
	const filteredConversations = visibleConversations.filter((c) =>
		c.withUserName.toLowerCase().includes(searchQuery.toLowerCase())
	);
	const selectedGroup = selectedGroupId
		? visibleGroups.find((group) => group.id === selectedGroupId)
		: undefined;

	return (
		<div className="chat-layout-wrapper">
			{/* ---------------- 1. LEFT SIDEBAR ---------------- */}
			<aside className="chat-sidebar">
				{/* Header: Left is (P) Profile Icon, Center is Teco Logo, Right is (LG) Logout */}
				<header className="sidebar-header">
					{/* (P) Profile Icon */}
					<button
						type="button"
						className={`retro-p-btn ${activeTab === "profile" && !selectedConversationId ? "active" : ""}`}
						title={`Profile: ${user?.name || "Operative"}`}
						aria-label="Open profile folder"
						onClick={() => {
							setSelectedConversationId(null);
							setSelectedGroupId(null);
							setActiveTab("profile");
						}}
					>
						<ProfileIcon aria-hidden="true" />
					</button>

					{/* Center Teco Brand Logo */}
					<button
						type="button"
						className="header-brand clickable"
						onClick={() => {
							setSelectedConversationId(null);
							setSelectedGroupId(null);
							setActiveTab(null);
						}}
						title="Clear workspace"
						aria-label="Clear workspace"
					>
						<img src={TecoLogo} alt="Teco" className="teco-logo-full" />
					</button>

					{/* (LG) Logout Button */}
					<button
						type="button"
						className="retro-lg-btn"
						onClick={signOut}
						title="Log out (LG)"
					>
						<LogoutIcon aria-hidden="true" />
						<span className="logout-label">Log out</span>
					</button>
				</header>

				{/* Sidebar Search Input */}
				<div className="sidebar-search-box">
					<SearchIcon />
					<input
						type="text"
						placeholder="Search chats..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="sidebar-search-input"
					/>
				</div>

				{/* Sidebar Conversation List */}
				<div className="sidebar-content">
					<div className="conversation-header-row">
						<span>Recent &amp; favorite conversations</span>
					</div>

					{!hasLoadedSocialData ? (
						<div className="sidebar-list-placeholder">
							<p>Loading conversations...</p>
						</div>
					) : filteredConversations.length > 0 ? (
						filteredConversations.map((c) => (
							<div
								className={`conversation-item ${
									selectedConversationId === c.id ? "conversation-item--selected" : ""
								}`}
								key={c.id}
								onClick={() => handleSelectConversation(c.id, c.withUserName)}
							>
								<div className="conv-avatar">
									{c.withUserName.charAt(0).toUpperCase()}
								</div>
								<div className="conv-details">
									<div className="conversation-user">{c.withUserName}</div>
									<div className="conversation-preview">
										{c.messagePreview || "Click to open chat thread"}
									</div>
								</div>
							</div>
						))
					) : (
						<div className="sidebar-list-placeholder">
							<p>No recent or favorite conversations yet.</p>
							<button
								type="button"
								className="start-chat-pill-btn"
								onClick={() => {
									setSelectedConversationId(null);
									setSelectedGroupId(null);
									setActiveTab("friends");
								}}
							>
								+ Find Friends
							</button>
						</div>
					)}
				</div>
			</aside>

			{/* ---------------- 2. MAIN WORKSPACE PANE ---------------- */}
			<main className="chat-main-pane">
				{/* Top Right Main Header */}
				<header className="main-pane-top-header">
					<div className="header-brand-spacer" aria-hidden="true" />
					<img src={TecoLogo} alt="Teco" className="teco-main-logo" />

					<div className="main-header-right">
						<button
							type="button"
							className="theme-toggle"
							onClick={onToggleTheme}
							title={isDark ? "Switch to light mode" : "Switch to dark mode"}
							aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
							aria-pressed={isDark}
						>
							<span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
							<span>{isDark ? "Light" : "Dark"}</span>
						</button>

						<button
							type="button"
							className={`retro-n-btn ${isNotifOpen ? "active" : ""}`}
							onClick={() => setIsNotifOpen((prev) => !prev)}
							title="Notifications"
							aria-label="Notifications"
							aria-expanded={isNotifOpen}
						>
							<BellIcon />
							{visiblePendingRequests.length > 0 && (
								<span className="n-badge-counter">{visiblePendingRequests.length}</span>
							)}
						</button>

						{/* Notification Dropdown Panel */}
						<NotificationDropdown
							isOpen={isNotifOpen}
							onClose={() => setIsNotifOpen(false)}
							pendingRequests={visiblePendingRequests}
							onAcceptRequest={handleAcceptFriendRequest}
							onDeclineRequest={handleDeclineFriendRequest}
						/>
					</div>
				</header>

				{/* Main navigation styled like browser tabs */}
				<nav className="main-tabs-capsules-bar" aria-label="Main Navigation">
					<div className="capsules-wrapper">
						{/* Friends Tab */}
						<button
							type="button"
							className={`capsule-pill ${
								activeTab === "friends" && !selectedConversationId ? "active" : ""
							}`}
							onClick={() => {
								setSelectedConversationId(null);
								setSelectedGroupId(null);
								setActiveTab("friends");
							}}
						>
							<UsersIcon />
							<span>Friends</span>
							{visiblePendingRequests.length > 0 && (
								<span className="capsule-badge">{visiblePendingRequests.length}</span>
							)}
						</button>

						{/* Profile Tab */}
						<button
							type="button"
							className={`capsule-pill ${
								activeTab === "profile" && !selectedConversationId ? "active" : ""
							}`}
							onClick={() => {
								setSelectedConversationId(null);
								setSelectedGroupId(null);
								setActiveTab("profile");
							}}
						>
							<ProfileIcon />
							<span>Profile</span>
						</button>

						{/* Chat Tab */}
						<button
							type="button"
							className={`capsule-pill ${
								activeTab === "chat" ? "active" : ""
							}`}
							onClick={() => {
								setSelectedConversationId(null);
								setSelectedGroupId(null);
								setActiveTab("chat");
								setActiveChatSection("chats");
							}}
						>
							<ChatIcon />
							<span>Chat</span>
						</button>
					</div>
				</nav>

				{activeTab === "chat" && !selectedConversationId && (
					<nav className="chat-section-nav" aria-label="Chat sections">
						<button
							type="button"
							className={`chat-section-tab ${activeChatSection === "chats" ? "active" : ""}`}
							aria-pressed={activeChatSection === "chats"}
							onClick={() => setActiveChatSection("chats")}
						>
							<ChatIcon />
							<span>Chats</span>
							<span className="chat-section-count">{visibleConversations.length}</span>
						</button>
						<button
							type="button"
							className={`chat-section-tab ${activeChatSection === "groups" ? "active" : ""}`}
							aria-pressed={activeChatSection === "groups"}
							onClick={() => setActiveChatSection("groups")}
						>
							<UsersIcon />
							<span>Groups</span>
							<span className="chat-section-count">{visibleGroups.length}</span>
						</button>
					</nav>
				)}

				{/* Main Content Area Canvas */}
				<div className="main-canvas-area">
					{hasLoadedSocialData && dataError && (
						<p className="chat-error" role="alert">
							{dataError}
						</p>
					)}
					{/* Case 1: Active Chat Window */}
					{!hasLoadedSocialData ? (
						<p className="empty-sub-state">Loading friends and conversations...</p>
					) : selectedConversationId ? (
						<ActiveChatView
							conversationId={selectedConversationId}
							recipientName={selectedContactName}
							currentUser={user}
							onMessageReceived={handleChatMessageReceived}
							onClose={handleCloseChat}
							group={selectedGroup}
							onManageGroup={() => selectedGroup && setGroupModal(selectedGroup)}
						/>
					) : activeTab === "chat" && activeChatSection === "chats" ? (
						/* Case 3: Persisted conversations and accepted friends */
						<ChatFolderView
							conversations={visibleConversations}
							friends={visibleFriends}
							onSelectConversation={handleSelectConversation}
							onStartChatWithFriend={handleStartChatWithFriend}
						/>
					) : activeTab === "chat" && activeChatSection === "groups" ? (
						<GroupsFolderView
							groups={visibleGroups}
							onSelectGroup={handleSelectGroup}
							onCreateGroup={() => setGroupModal(null)}
						/>
					) : activeTab === "friends" ? (
						/* Case 4: Friend requests and accepted friends */
						<FriendsFolderView
							friends={visibleFriends}
							pendingRequests={visiblePendingRequests}
							onSendRequest={handleSendFriendRequest}
							onAcceptRequest={handleAcceptFriendRequest}
							onDeclineRequest={handleDeclineFriendRequest}
							onStartChatWithFriend={handleStartChatWithFriend}
						/>
					) : activeTab === "profile" ? (
						/* Case 5: Profile Folder Tab ((*) Settings ear, user card) */
						<ProfileFolderView user={user} />
					) : null}
				</div>
			</main>
			{groupModal !== undefined && user?.id && (
				<GroupManagementModal
					group={groupModal}
					currentUserId={user.id}
					onClose={() => setGroupModal(undefined)}
					onSaved={handleGroupSaved}
				/>
			)}
		</div>
	);
}
