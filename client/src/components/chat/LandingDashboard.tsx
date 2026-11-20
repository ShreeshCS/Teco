import type { SafeUserDetails } from "@/types/auth.types";
import { ChatIcon, UsersIcon, ProfileIcon, GlobeIcon } from "./RetroIcons";

interface LandingDashboardProps {
	user: SafeUserDetails | null;
	conversationsCount: number;
	onNavigateTab: (tab: "chat" | "friends" | "profile") => void;
}

export default function LandingDashboard({
	user,
	conversationsCount,
	onNavigateTab,
}: LandingDashboardProps) {
	const displayName = user?.name || "Operative";
	const memberDate = user?.createdAt
		? new Date(user.createdAt).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: "Standard Access";

	return (
		<div className="landing-dashboard-wrapper">
			{/* Scanlines / Retro Cyber Header */}
			<div className="landing-hero-banner">
				<div className="hero-status-pill">
					<span className="live-dot" />
					<span className="live-label">SECURE LINK ESTABLISHED</span>
				</div>
				<h1 className="hero-title">WELCOME BACK, {displayName.toUpperCase()}</h1>
				<p className="hero-subtitle">
					Select a tab above or jump into your active communications below.
				</p>
			</div>

			{/* User Quick Identity Tag */}
			<div className="landing-user-badge-bar">
				<div className="badge-item">
					<span className="badge-label">USER ID:</span>
					<span className="badge-value code-font">
						{user?.id ? user.id.slice(0, 8) + "..." : "GUEST"}
					</span>
				</div>
				<div className="badge-item">
					<span className="badge-label">EMAIL:</span>
					<span className="badge-value">{user?.email || "anonymous"}</span>
				</div>
				<div className="badge-item">
					<span className="badge-label">MEMBER SINCE:</span>
					<span className="badge-value">{memberDate}</span>
				</div>
				<div className="badge-item">
					<span className="badge-label">ACTIVE CHATS:</span>
					<span className="badge-value highlight-cyan">{conversationsCount}</span>
				</div>
			</div>

			{/* 3 Main Quick-Launch Cards (matching the 3 tabs) */}
			<div className="landing-quick-grid">
				{/* 1. Chat Hub */}
				<div
					className="quick-card quick-card--chat"
					onClick={() => onNavigateTab("chat")}
					role="button"
					tabIndex={0}
				>
					<div className="card-top">
						<div className="card-icon">
							<ChatIcon />
						</div>
						<span className="card-tag">FOLDER // 01</span>
					</div>
					<h3 className="card-title">CHAT DIRECTORY</h3>
					<p className="card-desc">
						Open saved conversations or start a private chat with an accepted
						friend.
					</p>
					<div className="card-sub-features">
						<span>💬 Private friend conversations</span>
						<span>🗂️ Saved message history</span>
					</div>
					<button type="button" className="card-action-btn">
						Open Chat Folder →
					</button>
				</div>

				{/* 2. Friends Hub */}
				<div
					className="quick-card quick-card--friends"
					onClick={() => onNavigateTab("friends")}
					role="button"
					tabIndex={0}
				>
					<div className="card-top">
						<div className="card-icon">
							<UsersIcon />
						</div>
						<span className="card-tag">FOLDER // 02</span>
					</div>
					<h3 className="card-title">FRIENDS NETWORK</h3>
					<p className="card-desc">
						Review incoming friend requests and browse your saved friend list.
					</p>
					<div className="card-sub-features">
						<span>➕ Send & review requests</span>
						<span>👥 Accepted friends</span>
					</div>
					<button type="button" className="card-action-btn">
						Open Friends Folder →
					</button>
				</div>

				{/* 3. Profile Hub */}
				<div
					className="quick-card quick-card--profile"
					onClick={() => onNavigateTab("profile")}
					role="button"
					tabIndex={0}
				>
					<div className="card-top">
						<div className="card-icon">
							<ProfileIcon />
						</div>
						<span className="card-tag">FOLDER // 03</span>
					</div>
					<h3 className="card-title">PROFILE & IDENTITY</h3>
					<p className="card-desc">
						Inspect your profile attributes, user credentials, and upcoming
						customization settings.
					</p>
					<div className="card-sub-features">
						<span>⚙️ Settings gear</span>
						<span>🆔 User identity card</span>
					</div>
					<button type="button" className="card-action-btn">
						Open Profile Folder →
					</button>
				</div>
			</div>

			{/* Retro Terminal Footer */}
			<div className="landing-terminal-footer">
				<GlobeIcon />
				<span>TECO TERMINAL v0.1.0 // ALL SIGNALS NORMAL // STANDBY MODE READY</span>
			</div>
		</div>
	);
}
