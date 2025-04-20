import { PluginDashboard } from "./components/PluginDashboard";
import { ChatWindow } from "./components/VoiceChat/ChatWindow";

function App() {
  return (
    <div className="p-4 space-y-8">
      <ChatWindow />
      <PluginDashboard />
    </div>
  );
}

export default App;
