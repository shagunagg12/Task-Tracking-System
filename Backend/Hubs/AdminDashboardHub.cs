using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs
{
    public class AdminDashboardHub : Hub
    {
        // Clients can call this if needed, or we just use it for broadcasting
        public async Task SendStatsUpdate()
        {
            await Clients.All.SendAsync("ReceiveStatsUpdate");
        }
    }
}
