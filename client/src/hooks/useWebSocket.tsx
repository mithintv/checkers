import { useEffect, useState } from "react";

export default function useWebSocket(url: string) {
	const [ws, setWs] = useState<WebSocket | null>(null);
	const [messages, setMessages] = useState<{ type: string; color: string }[]>(
		[]
	);
	const [status, setStatus] = useState("connecting");

	useEffect(() => {
		const socket: WebSocket = new WebSocket(url);

		socket.onopen = () => {
			setStatus("connected");
		};

		socket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			setMessages((prevMessages) => [...prevMessages, message]);
		};

		socket.onclose = () => {
			setStatus("disconnected");
		};

		setWs(socket);

		return () => {
			socket.close();
		};
	}, [url]);

	const sendMessage = (msg: { type: string; color: string }) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(msg));
		}
	};

	return { messages, status, sendMessage };
}
