using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace Backend.WebSockets
{
    public class WebSocketManager
    {
        // ConnectionId -> WebSocket
        private ConcurrentDictionary<string, WebSocket> _sockets = new ConcurrentDictionary<string, WebSocket>();
        
        // UserId -> ConnectionIds
        private ConcurrentDictionary<string, HashSet<string>> _userConnections = new ConcurrentDictionary<string, HashSet<string>>();
        
        // ChatSessionId -> ConnectionIds
        private ConcurrentDictionary<string, HashSet<string>> _groupConnections = new ConcurrentDictionary<string, HashSet<string>>();

        public string AddSocket(WebSocket socket, string userId)
        {
            var connectionId = Guid.NewGuid().ToString();
            _sockets.TryAdd(connectionId, socket);

            _userConnections.AddOrUpdate(userId, 
                new HashSet<string> { connectionId },
                (key, existing) => { 
                    lock(existing) { existing.Add(connectionId); }
                    return existing; 
                }
            );

            return connectionId;
        }

        public async Task RemoveSocket(string connectionId, string userId)
        {
            if (_sockets.TryRemove(connectionId, out var socket))
            {
                if (socket.State == WebSocketState.Open)
                {
                    try {
                        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by manager", CancellationToken.None);
                    } catch {}
                }
            }

            if (_userConnections.TryGetValue(userId, out var userConns))
            {
                lock(userConns) { userConns.Remove(connectionId); }
            }

            // Remove from any groups
            foreach (var group in _groupConnections.Values)
            {
                lock(group) { group.Remove(connectionId); }
            }
        }

        public void AddToGroup(string connectionId, string groupId)
        {
            _groupConnections.AddOrUpdate(groupId,
                new HashSet<string> { connectionId },
                (key, existing) => { 
                    lock(existing) { existing.Add(connectionId); }
                    return existing; 
                }
            );
        }

        public void RemoveFromGroup(string connectionId, string groupId)
        {
            if (_groupConnections.TryGetValue(groupId, out var groupConns))
            {
                lock(groupConns) { groupConns.Remove(connectionId); }
            }
        }

        public async Task BroadcastToGroupAsync(string groupId, object message)
        {
            if (_groupConnections.TryGetValue(groupId, out var groupConns))
            {
                var msgString = JsonSerializer.Serialize(message, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                var bytes = Encoding.UTF8.GetBytes(msgString);
                var buffer = new ArraySegment<byte>(bytes, 0, bytes.Length);

                List<string> connectionIds;
                lock(groupConns) { connectionIds = groupConns.ToList(); }

                var tasks = new List<Task>();
                foreach (var connectionId in connectionIds)
                {
                    if (_sockets.TryGetValue(connectionId, out var socket))
                    {
                        if (socket.State == WebSocketState.Open)
                        {
                            tasks.Add(Task.Run(async () => {
                                try {
                                    await socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                                } catch (Exception ex) {
                                    Console.WriteLine("Broadcast Group Error: " + ex.Message);
                                }
                            }));
                        }
                    }
                }
                await Task.WhenAll(tasks);
            }
        }

        public async Task BroadcastToUsersAsync(IEnumerable<string> userIds, object message)
        {
            var msgString = JsonSerializer.Serialize(message, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var bytes = Encoding.UTF8.GetBytes(msgString);
            var buffer = new ArraySegment<byte>(bytes, 0, bytes.Length);

            var tasks = new List<Task>();
            foreach (var userId in userIds)
            {
                if (_userConnections.TryGetValue(userId, out var userConns))
                {
                    List<string> connectionIds;
                    lock(userConns) { connectionIds = userConns.ToList(); }
                    
                    foreach (var connectionId in connectionIds)
                    {
                        if (_sockets.TryGetValue(connectionId, out var socket))
                        {
                            if (socket.State == WebSocketState.Open)
                            {
                                tasks.Add(Task.Run(async () => {
                                    try {
                                        await socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                                    } catch (Exception ex) {
                                        Console.WriteLine("Broadcast User Error: " + ex.Message);
                                    }
                                }));
                            }
                        }
                    }
                }
            }
            await Task.WhenAll(tasks);
        }
        
        public async Task BroadcastToAllAsync(object message)
        {
            var msgString = JsonSerializer.Serialize(message, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var bytes = Encoding.UTF8.GetBytes(msgString);
            var buffer = new ArraySegment<byte>(bytes, 0, bytes.Length);

            var tasks = new List<Task>();
            foreach (var socket in _sockets.Values)
            {
                 if (socket.State == WebSocketState.Open)
                 {
                      tasks.Add(socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None));
                 }
            }
            await Task.WhenAll(tasks);
        }
    }
}
