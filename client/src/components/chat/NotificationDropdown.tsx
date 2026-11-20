import type { FriendRequestItem } from "@/types/friend.types";
import { CheckIcon, CloseIcon } from "./RetroIcons";

interface NotificationDropdownProps {
	isOpen: boolean;
	onClose: () => void;
	pendingRequests: FriendRequestItem[];
	onAcceptRequest: (requestId: string) => void;
	onDeclineRequest: (requestId: string) => void;
}

export default function NotificationDropdown({
	isOpen,
	onClose,
	pendingRequests,
	onAcceptRequest,
	onDeclineRequest,
}: NotificationDropdownProps) {
	if (!isOpen) return null;

	return (
		<div className="retro-notification-menu" role="dialog" aria-label="Notifications">
			<div className="notification-header">
				<span className="notification-title">🔔 SYSTEM ALERTS</span>
				<button
					type="button"
					className="notification-close-btn"
					onClick={onClose}
					aria-label="Close notifications"
				>
					<CloseIcon />
				</button>
			</div>

			<div className="notification-list">
				{pendingRequests.length === 0 ? (
					<div className="notification-empty">
						<p className="empty-text">No pending notifications</p>
						<span className="empty-sub">All quiet on the network.</span>
					</div>
				) : (
					pendingRequests.map((req) => (
						<div key={req.id} className="notification-item">
							<div className="notif-badge">REQ</div>
							<div className="notif-content">
								<p className="notif-text">
									<strong>{req.senderName || req.senderId}</strong> sent you a friend request
								</p>
								<span className="notif-time">
									{new Date(req.createdAt).toLocaleDateString()}
								</span>
							</div>
							<div className="notif-actions">
								<button
									type="button"
									className="notif-accept-btn"
									title="Accept Request"
									onClick={() => onAcceptRequest(req.id)}
								>
									<CheckIcon />
								</button>
								<button
									type="button"
									className="notif-decline-btn"
									title="Decline"
									onClick={() => onDeclineRequest(req.id)}
								>
									<CloseIcon />
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
