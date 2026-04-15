export function createInitialRequests() {
    return [
        {
            id: 'req-1',
            foodName: 'Bakery Surprise Box',
            requestedBy: 'Arjun, User',
            pickupType: 'Consumer pickup',
            status: 'pending',
        },
        {
            id: 'req-2',
            foodName: 'Event Snack Platter',
            requestedBy: 'Asha Foundation',
            pickupType: 'NGO pickup',
            status: 'pending',
        },
        {
            id: 'req-3',
            foodName: 'Idli + Sambar Pack',
            requestedBy: 'Priya, User',
            pickupType: 'Consumer pickup',
            status: 'accepted',
        },
    ]
}
