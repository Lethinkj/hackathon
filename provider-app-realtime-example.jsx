/**
 * EXAMPLE: Provider App - Real-Time Order Requests Dashboard
 * 
 * This example shows how to integrate Supabase realtime into the provider app
 * to receive instant notifications of incoming orders and requests.
 */

import React, { useState, useCallback } from 'react'
import { useRealtimeOrders, useRealtimeConsumerActivity } from '../hooks/useRealtimeOrders'
import { useRealtimeFoods } from '../hooks/useRealtimeFoods'
import { acceptRequest, rejectRequest } from '../lib/api'

export default function ProviderDashboard({ providerId }) {
  const [requests, setRequests] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [notifications, setNotifications] = useState([])

  // Hook 1: Monitor incoming requests/orders
  useRealtimeOrders(providerId, (update) => {
    console.log('Order request update:', update.type, update.data)

    switch (update.type) {
      case 'insert':
        // New order request from consumer or NGO!
        setRequests(prevRequests => [update.data, ...prevRequests])

        // Add notification
        setNotifications(prev => [
          {
            id: Date.now(),
            type: 'new_request',
            message: `New ${update.data.requester_type} request received!`,
            data: update.data,
            timestamp: new Date(),
          },
          ...prev,
        ])

        // Play sound alert
        playOrderAlert()

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('New Order!', {
            body: `Request from ${update.data.requester_type}`,
            icon: '🍽️',
            tag: 'order-request',
          })
        }
        break

      case 'update':
        // Request status changed (maybe consumer cancelled or accepted by another provider)
        setRequests(prevRequests =>
          prevRequests.map(r => (r.id === update.data.id ? update.data : r))
        )
        break

      case 'delete':
        // Request removed
        setRequests(prevRequests => prevRequests.filter(r => r.id !== update.data.id))
        break
    }
  })

  // Hook 2: Monitor overall consumer activity (optional - for analytics)
  useRealtimeConsumerActivity((update) => {
    if (update.type === 'new_order') {
      setActivityLog(prev => [
        {
          timestamp: new Date(),
          type: 'order_placed',
          data: update.data,
        },
        ...prev.slice(0, 49), // Keep last 50 activities
      ])
    }
  })

  // Hook 3: Monitor food listings (prices, quantities updating)
  const { foods } = useRealtimeFoods(providerId)

  // Handle accepting a request
  const handleAcceptRequest = useCallback(async (requestId) => {
    try {
      await acceptRequest(requestId)
      console.log('Request accepted:', requestId)

      // Remove from pending
      setRequests(prevRequests =>
        prevRequests.map(r =>
          r.id === requestId ? { ...r, status: 'accepted' } : r
        )
      )

      // Add success notification
      addNotification('success', 'Request accepted!')
    } catch (error) {
      console.error('Error accepting request:', error)
      addNotification('error', 'Failed to accept request')
    }
  }, [])

  // Handle rejecting a request
  const handleRejectRequest = useCallback(async (requestId) => {
    try {
      await rejectRequest(requestId)
      console.log('Request rejected:', requestId)

      // Remove from pending
      setRequests(prevRequests =>
        prevRequests.filter(r => r.id !== requestId)
      )

      addNotification('warning', 'Request rejected')
    } catch (error) {
      console.error('Error rejecting request:', error)
      addNotification('error', 'Failed to reject request')
    }
  }, [])

  const addNotification = (type, message) => {
    setNotifications(prev => [
      {
        id: Date.now(),
        type,
        message,
        timestamp: new Date(),
      },
      ...prev,
    ])
  }

  // Count by status
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const acceptedCount = requests.filter(r => r.status === 'accepted').length

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Provider Dashboard - Real-Time Orders</h1>

      {/* Top Stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={statBoxStyle}>
          <h3>{pendingCount}</h3>
          <p>Pending Requests</p>
        </div>
        <div style={statBoxStyle}>
          <h3>{acceptedCount}</h3>
          <p>Accepted</p>
        </div>
        <div style={statBoxStyle}>
          <h3>{foods.length}</h3>
          <p>Active Listings</p>
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '20px',
          maxHeight: '150px',
          overflowY: 'auto',
        }}>
          <h3>Notifications</h3>
          {notifications.slice(0, 5).map(notif => (
            <div
              key={notif.id}
              style={{
                padding: '8px',
                marginBottom: '5px',
                backgroundColor: getNotificationColor(notif.type),
                borderRadius: '4px',
                color: 'white',
              }}
            >
              <strong>{notif.type}</strong>: {notif.message}
              <br />
              <small>{notif.timestamp.toLocaleTimeString()}</small>
            </div>
          ))}
        </div>
      )}

      {/* Pending Requests */}
      <div>
        <h2>Pending Requests ({pendingCount})</h2>
        {requests.length === 0 ? (
          <p style={{ color: '#999' }}>No requests at the moment</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {requests
              .filter(r => r.status === 'pending')
              .map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => handleAcceptRequest(request.id)}
                  onReject={() => handleRejectRequest(request.id)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div style={{ marginTop: '30px' }}>
        <h2>Activity Log</h2>
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '10px',
          borderRadius: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {activityLog.length === 0 ? (
            <p style={{ color: '#999' }}>No activity yet</p>
          ) : (
            activityLog.slice(0, 20).map((activity, index) => (
              <div key={index} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {activity.timestamp.toLocaleTimeString()}
                </span>
                {' - '}
                <strong>{activity.type}</strong>
                <br />
                <small>{JSON.stringify(activity.data).substring(0, 60)}...</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function RequestCard({ request, onAccept, onReject }) {
  return (
    <div
      style={{
        padding: '15px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
          {request.requester_type === 'ngo' ? '🏢' : '👤'} {request.requester_type.toUpperCase()}
        </p>
        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
          Pickup: {request.pickup_type}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onAccept}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Accept
        </button>
        <button
          onClick={onReject}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  )
}

function playOrderAlert() {
  // Play a sound notification
  const audio = new Audio('/notification-sound.mp3')
  audio.play().catch(err => console.log('Could not play sound:', err))
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#4CAF50'
    case 'error': return '#f44336'
    case 'warning': return '#ff9800'
    case 'new_request': return '#2196F3'
    default: return '#666'
  }
}

const statBoxStyle = {
  flex: 1,
  padding: '20px',
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '8px',
  textAlign: 'center',
}
