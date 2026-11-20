import type { ChatGroup } from "@/types/chat.types";
import { UsersIcon } from "./RetroIcons";

interface GroupsFolderViewProps {
	groups: ChatGroup[];
	onSelectGroup: (group: ChatGroup) => void;
	onCreateGroup: () => void;
}

export default function GroupsFolderView({
	groups,
	onSelectGroup,
	onCreateGroup,
}: GroupsFolderViewProps) {
	return (
		<div className="retro-folder-container">
			<div className="folder-tabs-header">
				<div className="folder-tab-ear active">
					<UsersIcon />
					<span className="ear-label">Groups</span>
				</div>
			</div>
			<div className="folder-body-card group-folder-card">
				<div className="group-folder-heading">
					<div>
						<h2>GROUP CHATS</h2>
						<p>Join the conversation or create a private group of your own.</p>
					</div>
					<button type="button" className="group-primary-button" onClick={onCreateGroup}>
						+ Create new
					</button>
				</div>
				<div className="group-card-grid">
					{groups.map((group) => (
						<button
							type="button"
							className="group-card"
							key={group.id}
							onClick={() => onSelectGroup(group)}
						>
							<span className="group-card-icon">{group.icon || "👥"}</span>
							<span className="group-card-name">{group.name}</span>
							<span className="group-card-description">{group.description}</span>
							<span className="group-card-meta">
								{group.conversationParticipants.length} members
								{group.messages[0] ? ` · ${group.messages[0].content}` : " · No messages yet"}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
