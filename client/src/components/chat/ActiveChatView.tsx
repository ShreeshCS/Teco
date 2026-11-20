import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { SafeUserDetails } from "@/types/auth.types";
import type { ChatMessage } from "@/types/chat.types";
import { chatService } from "@/services";
import { BASE_URL } from "@/lib/api/apiClient";
import { SendIcon, CloseIcon } from "./RetroIcons";

interface SocketActionResult {
	ok: boolean;
	error?: string;
}

interface ServerToClientEvents {
	"message:new": (message: ChatMessage) => void;
}

interface ClientToServerEvents {
	"conversation:join": (
		conversationId: string,
		acknowledge: (result: SocketActionResult) => void,
	) => void;
	"message:send": (
		payload: { conversationId: string; content: string },
		acknowledge: (result: SocketActionResult) => void,
	) => void;
}

interface ActiveChatViewProps {
	conversationId: string;
	recipientName: string;
	currentUser: SafeUserDetails | null;
	onMessageReceived: (message: ChatMessage) => void;
	onClose: () => void;
}

export default function ActiveChatView({
	conversationId,
	recipientName,
	currentUser,
	onMessageReceived,
	onClose,
}: ActiveChatViewProps) {
	const [inputContent, setInputContent] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [isJoined, setIsJoined] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const socketRef = useRef<Socket<
		ServerToClientEvents,
		ClientToServerEvents
	> | null>(null);
	const onMessageReceivedRef = useRef(onMessageReceived);

	useEffect(() => {
		onMessageReceivedRef.current = onMessageReceived;
	}, [onMessageReceived]);

	useEffect(() => {
		let isActive = true;
		const socket = io(BASE_URL, {
			auth: { token: localStorage.getItem("token") },
			autoConnect: false,
		}) as Socket<ServerToClientEvents, ClientToServerEvents>;
		socketRef.current = socket;

		const appendMessage = (message: ChatMessage) => {
			if (!isActive) return;
			onMessageReceivedRef.current(message);
			setMessages((current) =>
				current.some((existing) => existing.id === message.id)
					? current
					: [...current, message],
			);
		};

		const refreshMessages = () => {
			void chatService
				.getConversationMessages(conversationId)
				.then((loadedMessages) => {
					if (isActive) {
						setMessages((current) => {
							const byId = new Map(
								current.map((message) => [message.id, message]),
							);
							for (const message of loadedMessages) {
								byId.set(message.id, message);
							}
							return [...byId.values()].sort(
								(a, b) =>
									new Date(a.createdAt).getTime() -
									new Date(b.createdAt).getTime(),
							);
						});
						const latestMessage = loadedMessages.at(-1);
						if (latestMessage) {
							onMessageReceivedRef.current(latestMessage);
						}
						setError(null);
					}
				})
				.catch((loadError: unknown) => {
					if (isActive) {
						setError(
							loadError instanceof Error
								? loadError.message
								: "Unable to load conversation messages.",
						);
					}
				})
				.finally(() => {
					if (isActive) setIsLoading(false);
				});
		};

		socket.on("message:new", appendMessage);
		socket.on("connect", () => {
			setIsJoined(false);
			socket.emit("conversation:join", conversationId, (result) => {
				if (!isActive) return;
				if (!result.ok) {
					setError(result.error || "Unable to join conversation.");
					return;
				}
				setError(null);
				setIsJoined(true);
				refreshMessages();
			});
		});
		socket.on("disconnect", (reason) => {
			if (isActive) {
				setIsJoined(false);
				setError(`Chat connection lost: ${reason}`);
			}
		});
		socket.on("connect_error", (connectError) => {
			if (isActive) {
				setError(connectError.message || "Unable to connect to chat.");
			}
		});

		socket.connect();
		refreshMessages();

		return () => {
			isActive = false;
			socket.disconnect();
			socketRef.current = null;
		};
	}, [conversationId]);

	const handleSendMessage = (event: React.FormEvent) => {
		event.preventDefault();
		const content = inputContent.trim();
		const socket = socketRef.current;
		if (!content || !socket?.connected || !isJoined || isSending) return;

		setIsSending(true);
		socket.timeout(10000).emit(
			"message:send",
			{ conversationId, content },
			(timeoutError, result) => {
				setIsSending(false);
				if (timeoutError) {
					setError("Message was not acknowledged. Check your connection.");
					return;
				}
				if (!result.ok) {
					setError(result.error || "Unable to send message.");
					return;
				}
				setError(null);
				setInputContent("");
			},
		);
	};

	return (
		<div className="active-chat-wrapper">
			<div className="active-chat-header">
				<div className="chat-recipient-info">
					<div className="recipient-avatar">
						{recipientName.charAt(0).toUpperCase()}
					</div>
					<div className="recipient-meta">
						<span className="recipient-name">{recipientName}</span>
						<span className="recipient-status">
							Private conversation • ID: {conversationId.slice(0, 8)}
						</span>
					</div>
				</div>

				<div className="chat-header-actions">
					<button
						type="button"
						className="chat-close-btn"
						onClick={onClose}
						title="Close chat & return to dashboard"
					>
						<CloseIcon />
						<span>Close</span>
					</button>
				</div>
			</div>

			<div className="active-chat-messages" aria-live="polite">
				{error && (
					<p className="chat-error" role="alert">
						{error}
					</p>
				)}
				{isLoading ? (
					<p className="empty-sub-state">Loading messages...</p>
				) : messages.length === 0 ? (
					<p className="empty-sub-state">
						No messages yet. Send the first message to {recipientName}.
					</p>
				) : (
					messages.map((message) => {
						const isMe = message.createdById === currentUser?.id;
						return (
							<div
								key={message.id}
								className={`message-bubble-row ${isMe ? "message-outgoing" : "message-incoming"}`}
							>
								<div className="bubble-content">
									<div className="bubble-sender-meta">
										<span className="sender-name">
											{isMe ? "You" : message.createdBy.name}
										</span>
										<span className="message-time">
											{new Date(message.createdAt).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									<p className="message-text">{message.content}</p>
								</div>
							</div>
						);
					})
				)}
			</div>

			<form onSubmit={handleSendMessage} className="active-chat-input-bar">
				<input
					type="text"
					placeholder={`Message ${recipientName}...`}
					value={inputContent}
					onChange={(event) => setInputContent(event.target.value)}
					className="retro-chat-input"
					maxLength={4000}
					disabled={!isJoined}
				/>
				<button
					type="submit"
					disabled={!inputContent.trim() || !isJoined || isSending}
					className="retro-send-btn"
				>
					<SendIcon />
					<span>{isSending ? "Sending..." : "Send"}</span>
				</button>
			</form>
		</div>
	);
}
