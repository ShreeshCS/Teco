import { useState } from "react";
import type { FriendUser, FriendRequestItem } from "@/types/friend.types";
import { UsersIcon, PlusIcon, SearchIcon, CheckIcon, CloseIcon, SendIcon } from "./RetroIcons";

interface FriendsFolderViewProps {
	friends: FriendUser[];
	pendingRequests: FriendRequestItem[];
	onSendRequest: (receiverId: string) => Promise<boolean>;
	onAcceptRequest: (requestId: string) => Promise<void>;
	onDeclineRequest: (requestId: string) => void;
	onStartChatWithFriend: (friend: FriendUser) => void;
}

export default function FriendsFolderView({
	friends,
	pendingRequests,
	onSendRequest,
	onAcceptRequest,
	onDeclineRequest,
	onStartChatWithFriend,
}: FriendsFolderViewProps) {
	// Requests are received from the backend; accepted friends are loaded separately.
	const [activeSubTab, setActiveSubTab] = useState<"requests" | "all">("requests");
	const [requestMode, setRequestMode] = useState<"send" | "view">("send");

	// Input for sending request
	const [targetUserId, setTargetUserId] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [sendFeedback, setSendFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

	// Search filter for all friends
	const [searchFilter, setSearchFilter] = useState("");

	const filteredFriends = friends.filter((f) =>
		f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
		f.email.toLowerCase().includes(searchFilter.toLowerCase())
	);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!targetUserId.trim()) return;

		setIsSending(true);
		setSendFeedback(null);
		try {
			const success = await onSendRequest(targetUserId.trim());
			if (success) {
				setSendFeedback({
					type: "success",
					msg: `Friend request dispatched to ${targetUserId}!`,
				});
				setTargetUserId("");
			} else {
				setSendFeedback({
					type: "error",
					msg: "Could not send friend request. Check the user ID/email.",
				});
			}
		} catch (err: unknown) {
			const errorMsg =
				err instanceof Error
					? err.message
					: "Could not dispatch request. Please try again.";
			setSendFeedback({
				type: "error",
				msg: errorMsg,
			});
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="retro-folder-container">
			{/* Physical Folder Top Ear with (+) button right on the ear */}
			<div className="folder-tabs-header">
				<div className="folder-tab-ear active">
					<UsersIcon />
					<span className="ear-label">Friends</span>
					<button
						type="button"
						className="folder-ear-plus-btn"
						title="Quick Send Friend Request"
						onClick={() => {
							setActiveSubTab("requests");
							setRequestMode("send");
						}}
					>
						<PlusIcon />
					</button>
				</div>
			</div>

			{/* Folder Inner Card */}
			<div className="folder-body-card folder-body-card--with-nav">
				{/* Friend requests and accepted friends navigation */}
				<div className="folder-subsections-nav">
					<button
						type="button"
						className={`sub-nav-btn ${activeSubTab === "requests" ? "active" : ""}`}
						onClick={() => setActiveSubTab("requests")}
					>
						<PlusIcon />
						<span>1. Friend Requests</span>
						{pendingRequests.length > 0 && (
							<span className="badge-count badge-alert">{pendingRequests.length}</span>
						)}
					</button>

					<button
						type="button"
						className={`sub-nav-btn ${activeSubTab === "all" ? "active" : ""}`}
						onClick={() => setActiveSubTab("all")}
					>
						<UsersIcon />
						<span>2. All Friend List</span>
						<span className="badge-count">{friends.length}</span>
					</button>
				</div>

				{/* SUBSECTION 1: FRIEND REQUESTS (with 2 options: Send / View) */}
				{activeSubTab === "requests" && (
					<div className="subsection-pane">
						<div className="requests-mode-toggle">
							<button
								type="button"
								className={`mode-pill ${requestMode === "send" ? "active" : ""}`}
								onClick={() => setRequestMode("send")}
							>
								Option A: Send Friend Request
							</button>
							<button
								type="button"
								className={`mode-pill ${requestMode === "view" ? "active" : ""}`}
								onClick={() => setRequestMode("view")}
							>
								Option B: View Friend Requests
								{pendingRequests.length > 0 && (
									<span className="inline-badge">{pendingRequests.length}</span>
								)}
							</button>
						</div>

						{/* Option A: Send Friend Request */}
						{requestMode === "send" && (
							<div className="send-request-box">
								<h4 className="box-title">SEND A NEW FRIEND REQUEST</h4>
								<p className="box-sub">
									Enter the unique User ID or registered Email address to connect.
								</p>
								<form onSubmit={handleSend} className="send-request-form">
									<div className="input-group">
										<input
											type="text"
											placeholder="Recipient User ID or Email..."
											value={targetUserId}
											onChange={(e) => setTargetUserId(e.target.value)}
											className="retro-input"
											disabled={isSending}
										/>
										<button
											type="submit"
											disabled={isSending || !targetUserId.trim()}
											className="retro-submit-btn"
										>
											<SendIcon />
											<span>{isSending ? "Dispatching..." : "Send Req"}</span>
										</button>
									</div>
									{sendFeedback && (
										<div
											className={`feedback-msg feedback-${sendFeedback.type}`}
										>
											{sendFeedback.msg}
										</div>
									)}
								</form>
							</div>
						)}

						{/* Option B: View Friend Requests */}
						{requestMode === "view" && (
							<div className="view-requests-box">
								<h4 className="box-title">PENDING FRIEND REQUESTS</h4>
								{pendingRequests.length === 0 ? (
									<div className="empty-sub-state">
										<p className="empty-title">No pending requests</p>
										<p className="empty-desc">
											You are completely caught up! No incoming invites waiting.
										</p>
									</div>
								) : (
									<div className="requests-list">
										{pendingRequests.map((req) => (
											<div key={req.id} className="request-card">
												<div className="request-user-info">
													<div className="user-avatar-tag">
														{(req.senderName || req.senderId).charAt(0).toUpperCase()}
													</div>
													<div className="user-details">
														<span className="user-name">
															{req.senderName || req.senderId}
														</span>
														<span className="req-date">
															Received {new Date(req.createdAt).toLocaleDateString()}
														</span>
													</div>
												</div>
												<div className="request-actions">
													<button
														type="button"
														className="action-btn-accept"
														onClick={() => onAcceptRequest(req.id)}
													>
														<CheckIcon />
														<span>Accept</span>
													</button>
													<button
														type="button"
														className="action-btn-decline"
														onClick={() => onDeclineRequest(req.id)}
													>
														<CloseIcon />
														<span>Decline</span>
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* SUBSECTION 2: ALL FRIEND LIST */}
				{activeSubTab === "all" && (
					<div className="subsection-pane">
						<div className="subsection-banner">
							<div className="banner-left">
								<h3 className="pane-title">📋 ALL CONFIRMED FRIENDS</h3>
								<p className="pane-desc">
									Total friends connected to your account ({friends.length}).
								</p>
							</div>
							<div className="search-input-wrapper">
								<SearchIcon />
								<input
									type="text"
									placeholder="Search friends by name or email..."
									value={searchFilter}
									onChange={(e) => setSearchFilter(e.target.value)}
									className="retro-search-input"
								/>
							</div>
						</div>

						{friends.length === 0 ? (
							<div className="empty-sub-state">
								<p className="empty-title">Friend list is empty</p>
								<p className="empty-desc">
									Use the <strong>Send Friend Request</strong> option above to add your first friend!
								</p>
							</div>
						) : (
							<div className="all-friends-table">
								{filteredFriends.map((f) => (
									<div key={f.id} className="friend-row-item">
										<div className="friend-info-block">
											<div className="friend-avatar-circle">
														{f.name.charAt(0).toUpperCase()}
													</div>
											<div className="friend-meta">
												<span className="friend-full-name">{f.name}</span>
												<span className="friend-email-sub">{f.email}</span>
											</div>
										</div>

										<div className="friend-actions">
											<button
												type="button"
												className="retro-chat-btn"
												onClick={() => onStartChatWithFriend(f)}
											>
												Chat ⚡
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
