import RequestCard from '../components/RequestCard'import RequestCard from '../components/RequestCard'import RequestCard from '../components/RequestCard'




























}    )        </div>            </div>                })}                    )                        />                            distFee={distFee}                            onInitiate={onInitiate}                            onDecline={onDecline}                            onAccept={onAccept}                            onSelectDelivery={onSelectDelivery}                            selected={selectedDelivery[key] || 'self'}                            request={request}                            key={request.id}                        <RequestCard                    return (                    const key = `del-${request.id}`                {requests.map((request) => {            <div className="req-list" id="req-list">            <div className="page-sub">Incoming orders from consumers, users & NGOs</div>            <div className="page-title">Requests</div>        <div className="page active" id="page-requests">    return (export default function Requests({ requests, selectedDelivery, onSelectDelivery, onAccept, onDecline, onInitiate, distFee }) {


























}    )        </div>            </div>                })}                    )                        />                            distFee={distFee}                            onInitiate={onInitiate}                            onDecline={onDecline}                            onAccept={onAccept}                            onSelectDelivery={onSelectDelivery}                            selected={selectedDelivery[key] || 'self'}                            request={request}                            key={request.id}                        <RequestCard                    return (                    const key = `del-${request.id}`                {requests.map((request) => {            <div className="req-list" id="req-list">            <div className="page-sub">Incoming orders from consumers, users & NGOs</div>            <div className="page-title">Requests</div>        <div className="page active" id="page-requests">    return (export default function Requests({ requests, selectedDelivery, onSelectDelivery, onAccept, onDecline, onInitiate, distFee }) {
export default function Requests({ requests, onAccept, onReject }) {
    return (
        <div className="page">
            <div className="page-header">
                <h2 className="page-title">Requests</h2>
                <p className="page-subtitle">Incoming pickup requests from users and NGOs.</p>
            </div>

            <div className="cards-grid">
                {requests.map((request) => (
                    <RequestCard key={request.id} request={request} onAccept={onAccept} onReject={onReject} />
                ))}
            </div>
        </div>
    )
}
