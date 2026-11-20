import { useEffect, useState } from "react";
import type { ChatGroup } from "@/types/chat.types";
import type { FriendUser } from "@/types/friend.types";
import { groupService, userService } from "@/services";

interface GroupManagementModalProps {
	group: ChatGroup | null;
	currentUserId: string;
	onClose: () => void;
	onSaved: (groupId?: string) => void;
}

export default function GroupManagementModal({
	group,
	currentUserId,
	onClose,
	onSaved,
}: GroupManagementModalProps) {
	const [users, setUsers] = useState<FriendUser[]>([]);
	const [name, setName] = useState(group?.name ?? "");
	const [description, setDescription] = useState(group?.description ?? "");
	const [icon, setIcon] = useState(group?.icon ?? "👥");
	const [memberIds, setMemberIds] = useState<string[]>(
		group?.conversationParticipants.map((member) => member.userId) ?? [currentUserId],
	);
	const [adminIds, setAdminIds] = useState<string[]>(
		group?.conversationParticipants
			.filter((member) => member.role === "ADMIN")
			.map((member) => member.userId) ?? [],
	);
	const [userSearch, setUserSearch] = useState("");
	const [isLoadingUsers, setIsLoadingUsers] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isOwner = !group || group.ownerId === currentUserId;
	const canManage = !group || isOwner || group.conversationParticipants.some(
		(member) => member.userId === currentUserId && member.role === "ADMIN",
	);

	useEffect(() => {
		let active = true;
		void userService.getAllUsers()
			.then((result) => { if (active) setUsers(result); })
			.catch((loadError: unknown) => {
				if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
			})
			.finally(() => { if (active) setIsLoadingUsers(false); });
		return () => { active = false; };
	}, []);

	const toggleMember = (userId: string) => {
		const removing = memberIds.includes(userId);
		setMemberIds((current) => removing
			? current.filter((id) => id !== userId)
			: [...current, userId]);
		if (removing) setAdminIds((admins) => admins.filter((id) => id !== userId));
	};

	const toggleAdmin = (userId: string) => {
		setAdminIds((current) =>
			current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
		);
	};

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSaving(true);
		setError(null);
		try {
			if (group) {
				await groupService.updateGroup(group.id, {
					...(isOwner ? { name: name.trim(), icon: icon.trim(), adminIds } : {}),
					description: description.trim(),
					memberIds,
				});
				onSaved(group.id);
			} else {
				const created = await groupService.createGroup({
					name: name.trim(),
					description: description.trim(),
					icon: icon.trim(),
					memberIds: memberIds.filter((id) => id !== currentUserId),
				});
				onSaved(created.id);
			}
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to save group.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!group || !window.confirm(`Delete "${group.name}" and its messages? This cannot be undone.`)) return;
		setIsSaving(true);
		setError(null);
		try {
			await groupService.deleteGroup(group.id);
			onSaved();
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : "Unable to delete group.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="group-modal-backdrop" role="presentation" onMouseDown={(event) => {
			if (event.target === event.currentTarget) onClose();
		}}>
			<section className="group-modal" role="dialog" aria-modal="true" aria-labelledby="group-modal-title">
				<header className="group-modal-header">
					<h2 id="group-modal-title">{group ? "Group settings" : "Create a group"}</h2>
					<button type="button" aria-label="Close group settings" onClick={onClose}>×</button>
				</header>
				{!canManage || group?.groupKey ? (
					<div className="group-modal-body">
						<p>This group can’t be changed here.</p>
						<button type="button" className="group-secondary-button" onClick={onClose}>Close</button>
					</div>
				) : (
					<form className="group-modal-body" onSubmit={handleSave}>
						<label>
							Group name
							<input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required disabled={!isOwner} />
						</label>
						<label>
							Description
							<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={3} />
						</label>
						{isOwner && (
							<label>
								Group icon (emoji)
								<input value={icon} onChange={(event) => setIcon(event.target.value)} maxLength={16} required />
							</label>
						)}
						<div className="group-member-picker">
							<div className="group-picker-title">People in this group</div>
							<input
								className="group-user-search"
								type="search"
								placeholder="Find people..."
								value={userSearch}
								onChange={(event) => setUserSearch(event.target.value)}
								disabled={isLoadingUsers}
							/>
							{isLoadingUsers ? <p>Loading people…</p> : users.filter((candidate) =>
								`${candidate.name} ${candidate.email}`.toLowerCase().includes(userSearch.toLowerCase()),
							).filter((candidate) =>
								candidate.id !== currentUserId || memberIds.includes(currentUserId),
							).map((candidate) => {
								const member = group?.conversationParticipants.find((item) => item.userId === candidate.id);
								const memberRole = member?.role ?? (
									candidate.id === currentUserId && !group
										? "OWNER"
										: memberIds.includes(candidate.id) ? "MEMBER" : null
								);
								const protectedMember = member?.role === "OWNER" || (!isOwner && member?.role === "ADMIN");
								return (
									<div className="group-member-option" key={candidate.id}>
										<label>
											<input
												type="checkbox"
												checked={memberIds.includes(candidate.id)}
												disabled={candidate.id === currentUserId || protectedMember}
												onChange={() => toggleMember(candidate.id)}
											/>
											{memberRole && (
												<span className={`group-role-symbol role-${memberRole.toLowerCase()}`} title={memberRole.toLowerCase()}>
													{memberRole === "OWNER" ? "♛" : memberRole === "ADMIN" ? "✦" : "●"}
												</span>
											)}
											<span>{candidate.name}</span>
										</label>
										{memberIds.includes(candidate.id) && member?.role !== "OWNER" && isOwner && (
											<label className="group-admin-toggle">
												<input type="checkbox" checked={adminIds.includes(candidate.id)} onChange={() => toggleAdmin(candidate.id)} />
												Admin
											</label>
										)}
										{memberIds.includes(candidate.id) && !isOwner && member && (
											<span className={`group-role-label role-${member.role.toLowerCase()}`}>{member.role.toLowerCase()}</span>
										)}
									</div>
								);
							})}
						</div>
						{error && <p className="chat-error" role="alert">{error}</p>}
						<footer className="group-modal-actions">
							{group && isOwner && <button type="button" className="group-danger-button" onClick={handleDelete} disabled={isSaving}>Delete group</button>}
							<button type="button" className="group-secondary-button" onClick={onClose}>Cancel</button>
							<button type="submit" className="group-primary-button" disabled={isSaving || isLoadingUsers || !name.trim()}>
								{isSaving ? "Saving…" : group ? "Save changes" : "Create group"}
							</button>
						</footer>
					</form>
				)}
			</section>
		</div>
	);
}
