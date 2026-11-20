import { useState, useEffect } from "react";
import TecoLogo from "../assets/Teco_Logo.png";
import "./ChatLayout.scss";
import { useAuth } from "../hooks/useAuth";
import type { ChatMessage, Conversation } from "../types/chat.types";
import type { FriendUser, FriendRequestItem } from "../types/friend.types";
import { chatService, friendService } from "@/services";

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

interface ChatLayoutProps {
	isDark: boolean;
	onToggleTheme: () => void;
}

export default function ChatLayout({ isDark, onToggleTheme }: ChatLayoutProps) {
	const { signOut, user } = useAuth();

	// No folder is selected until the user opens one.
	const [activeTab, setActiveTab] = useState<"friends" | "profile" | "chat" | null>(null);

	// Active selected conversation
	const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
	const [selectedContactName, setSelectedContactName] = useState<string>("Chat Room");

	const [searchQuery, setSearchQuery] = useState("");

	// Data states
	const [conversations, setConversations] = useState<Conversation[]>([]);
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
		]).then(([conversationResult, friendResult, requestResult]) => {
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

			setDataError(errors.length > 0 ? errors.join(" ") : null);
			setLoadedUserId(user.id);
		});

		return () => { isActive = false; };
	}, [user?.id]);

	const hasLoadedSocialData = !!user?.id && loadedUserId === user.id;
	const visibleConversations = hasLoadedSocialData ? conversations : [];
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
	};

	const handleChatMessageReceived = (message: ChatMessage) => {
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
								activeTab === "chat" && !selectedConversationId ? "active" : ""
							}`}
							onClick={() => {
								setSelectedConversationId(null);
								setActiveTab("chat");
							}}
						>
							<ChatIcon />
							<span>Chat</span>
						</button>
					</div>
				</nav>

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
						/>
					) : activeTab === "chat" ? (
						/* Case 3: Persisted conversations and accepted friends */
						<ChatFolderView
							conversations={visibleConversations}
							friends={visibleFriends}
							onSelectConversation={handleSelectConversation}
							onStartChatWithFriend={handleStartChatWithFriend}
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
		</div>
	);
}
