import type { SafeUserDetails } from "@/types/auth.types";
import { ProfileIcon, SettingsIcon } from "./RetroIcons";

interface ProfileFolderViewProps {
	user: SafeUserDetails | null;
}

export default function ProfileFolderView({ user }: ProfileFolderViewProps) {
	const memberDate = user?.createdAt
		? new Date(user.createdAt).toLocaleDateString(undefined, {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "Unknown";

	return (
		<div className="retro-folder-container">
			{/* Physical Folder Top Ear with (*) Settings button */}
			<div className="folder-tabs-header">
				<div className="folder-tab-ear active">
					<ProfileIcon />
					<span className="ear-label">Profile</span>
					<button
						type="button"
						className="folder-ear-settings-btn"
						title="Settings"
					>
						<SettingsIcon />
					</button>
				</div>
			</div>

			{/* Folder Inner Card */}
			<div className="folder-body-card">
				<div className="profile-card-content">
					<div className="profile-avatar-display">
						<div className="avatar-big">
							{user?.name ? user.name.charAt(0).toUpperCase() : "U"}
						</div>
						<div className="avatar-meta">
							<h3 className="profile-display-name">{user?.name || "Teco User"}</h3>
							<span className="profile-badge">MEMBER LEVEL 01</span>
						</div>
					</div>

					<div className="profile-details-grid">
						<div className="detail-item">
							<span className="detail-label">OPERATIVE ID:</span>
							<span className="detail-value code-font">{user?.id || "N/A"}</span>
						</div>

						<div className="detail-item">
							<span className="detail-label">EMAIL ADDRESS:</span>
							<span className="detail-value">{user?.email || "N/A"}</span>
						</div>

						<div className="detail-item">
							<span className="detail-label">REGISTRATION DATE:</span>
							<span className="detail-value">{memberDate}</span>
						</div>

						<div className="detail-item">
							<span className="detail-label">CONNECTION STATUS:</span>
							<span className="detail-value highlight-cyan">ACTIVE // ENCRYPTED</span>
						</div>
					</div>

					<div className="profile-placeholder-notice">
						<SettingsIcon />
						<div className="notice-text">
							<h4>PROFILE & SETTINGS UPGRADE</h4>
							<p>
								Advanced profile customization, avatar uploads, and sound/theme settings
								are queued for future updates.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
