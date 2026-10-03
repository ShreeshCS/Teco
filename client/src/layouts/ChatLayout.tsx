import { Outlet } from "react-router-dom";
import TecoLogo from "../assets/Teco_Logo.png";
import "./ChatLayout.scss";
import { useAuth } from "../hooks/useAuth";

export default function ChatLayout() {
	const { signOut } = useAuth();

	const handleLogout = () => {
		signOut();
	};

	return (
		<div className="chat-layout-wrapper">
			{/* 1. Left Sidebar: Header, contacts, conversations */}
			<aside className="chat-sidebar">
				<header className="sidebar-header">
					<div className="header-brand">
						<img
							src={TecoLogo}
							alt="Teco"
							className="teco-logo-full"
						/>
					</div>
					<button className="retro-logout-btn" onClick={handleLogout}>
						Logout
					</button>
				</header>

				<div className="sidebar-content">
					<div className="conversation-header-row">
						<span>Conversations</span>
					</div>
					{/* ConversationList or UserList will be mounted here */}
					<div className="sidebar-list-placeholder">
						<p>No active chats yet.</p>
					</div>
				</div>
			</aside>

			{/* 2. Main Workspace: Chat window or Empty State */}
			<main className="chat-main-pane">
				<Outlet />
			</main>
		</div>
	);
}
