import RequestCardClean from '../components/RequestCardClean'

export default function RequestsClean({ requests, selectedDelivery, onSelectDelivery, onAccept, onDecline, onInitiate, distFee }) {
    return (
        <div className="page active" id="page-requests">
            <div className="page-title">Requests</div>
            <div className="page-sub">Incoming orders from consumers, users & NGOs</div>

            <div className="req-list" id="req-list">
                {requests.map((request) => {
                    const key = `del-${request.id}`
                    return (
                        <RequestCardClean
                            key={request.id}
                            request={request}
                            selected={selectedDelivery[key] || 'self'}
                            onSelectDelivery={onSelectDelivery}
                            onAccept={onAccept}
                            onDecline={onDecline}
                            onInitiate={onInitiate}
                            distFee={distFee}
                        />
                    )
                })}
            </div>
        </div>
    )
}
