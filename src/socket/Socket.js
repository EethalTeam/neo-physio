import { io } from "socket.io-client";
import { config } from '@/components/CustomComponents/config';
const socket = io(config.Api, {
  transports: ["websocket"],
});

export default socket;