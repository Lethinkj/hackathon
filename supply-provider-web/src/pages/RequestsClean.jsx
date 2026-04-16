import RequestCardClean from '../components/RequestCardClean'

export default function RequestsClean({ requests, loading, onAccept, onDecline }) {
    return (
        <div className="page active" id="page-requests">
            <div className="page-title">Requests</div>
            <div className="page-sub">Incoming requests from consumers and NGOs</div>

            <div className="req-list" id="req-list">
                {loading ? <div className="history-empty">Loading requests...</div> : null}
                {!loading && requests.map((request) => (
                    <RequestCardClean key={request.id} request={request} onAccept={onAccept} onDecline={onDecline} />
                ))}
                {!loading && !requests.length ? <div className="history-empty">No requests yet.</div> : null}
            </div>
        </div>
    )
}
