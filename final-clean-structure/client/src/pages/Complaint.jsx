import ComplaintChatBox from "../components/chat/ComplaintChatBox.jsx";
import ContactActions from "../components/common/ContactActions.jsx";

export default function Complaint() {
  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Support</h2>
          <p className="muted">For order issues, use the chat below. Phone support appears here when operations assigns a support line.</p>
          <ContactActions title="SmartFood Support" subtitle="Complaint support desk" />
        </div>
        <ComplaintChatBox />
      </div>
    </section>
  );
}
