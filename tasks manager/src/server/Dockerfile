# Server image: builds only what the API needs (Core, Data, Api), not the tests or tools.
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY Directory.Build.props ./
COPY SprintManager.Core/ SprintManager.Core/
COPY SprintManager.Data/ SprintManager.Data/
COPY SprintManager.Api/ SprintManager.Api/
RUN dotnet publish SprintManager.Api/SprintManager.Api.csproj -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
# Listens on 8080 inside the container; compose publishes it.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "SprintManager.Api.dll"]
