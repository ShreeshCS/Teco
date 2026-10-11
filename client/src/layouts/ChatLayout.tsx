import { Outlet } from "react-router-dom";
import TecoLogo from "../assets/Teco_Logo.png";
import "./ChatLayout.scss";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import type { Conversation } from "../types/chat.types";
import { chatService } from "@/services";
import "./ChatLayout.scss";

export default function ChatLayout() {
	const { signOut, user } = useAuth();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedConversationId, setSelectedConversationId] = useState<
		string | null
	>(null);
	const handleLogout = () => {
		signOut();
	};

	useEffect(() => {
		async function getConversation() {
			const res: Conversation[] = await chatService.getConversationList();
			if (res) {
				setConversations(res);
			}
		}
		getConversation();
	}, [user]);

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
					{conversations && conversations.length > 0 ? (
						conversations.map((c) => (
							<div
								className={`conversation-item ${
									selectedConversationId === c.id
										? "conversation-item--selected"
										: ""
								}`}
								key={c.id}
								onClick={() => setSelectedConversationId(c.id)}
							>
								<div className="conversation-user">
									{c.withUserName}
								</div>
								<div className="conversation-preview">
									{c.messagePreview}
								</div>
							</div>
						))
					) : (
						<div className="sidebar-list-placeholder">
							<p>No active chats yet.</p>
						</div>
					)}
				</div>
			</aside>

			{/* 2. Main Workspace: Chat window or Empty State */}
			<main className="chat-main-pane">
				<Outlet context={{ selectedConversationId }} />
			</main>
		</div>
	);
}
