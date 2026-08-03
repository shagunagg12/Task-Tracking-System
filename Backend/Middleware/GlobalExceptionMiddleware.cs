using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Backend.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception has occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = StatusCodes.Status500InternalServerError;
            var message = "Internal Server Error from the custom middleware.";

            if (exception is KeyNotFoundException)
            {
                statusCode = StatusCodes.Status404NotFound;
                message = exception.Message;
            }
            else if (exception is UnauthorizedAccessException)
            {
                statusCode = StatusCodes.Status401Unauthorized;
                message = "Unauthorized access.";
            }
            else if (exception is ArgumentException || exception is InvalidOperationException)
            {
                statusCode = StatusCodes.Status400BadRequest;
                message = exception.Message;
            }

            context.Response.StatusCode = statusCode;

            var result = JsonSerializer.Serialize(new
            {
                statusCode = statusCode,
                message = message,
                details = exception.InnerException?.Message
            });

            return context.Response.WriteAsync(result);
        }
    }
}
