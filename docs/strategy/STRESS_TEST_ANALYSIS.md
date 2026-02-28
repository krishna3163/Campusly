# Campusly Stress Test Simulation Engine Analysis

This document simulates tiered stress scenarios for the Campusly ecosystem based on the current local-first, InsForge-backed architecture.

---

## Scenario A: The Single Campus Baseline (Mid-Tier)
*   **Scale**: 1 Campus | 2,000 DAU | 50 Concurrent Rooms | 200 msg/min | 10 Voice Rooms | 5MB Media Avg.

### 1. Bottleneck Analysis
*   **Realtime Bus**: 50 concurrent rooms with 2,000 users means high fan-out for presence events.
*   **Media Processing**: 5MB media transfers at 200 msg/min (if 10% are media) creates ~100MB/min throughput.

### 2. WebSocket Scaling Limits
*   Single InsForge realtime node can easily handle 2k concurrent connections. Initial bottleneck is client-side state reconciliation if all 2k users are in a single "General" room.

### 3. Database Read/Write Stress Points
*   200 writes/min is negligible for PostgreSQL (~3.3 TPS). No major stress.

### 4. IndexedDB Performance
*   Small dataset per user. High hit rate. Sync worker will be idle 90% of the time.

### 5. P2P File Fallback
*   Will work optimally in hostels on same LAN/WLAN. Success rate ~70%.

---

## Scenario B: The Peak Festival / Orientation (Scale-up)
*   **Scale**: 1 Campus | 10,000 Users | 1,000 msg/min | 200 Concurrent Realtime Sessions | 50 Simultaneous Transfers.

### 1. Bottleneck Analysis
*   **Presence Updates**: 10k users checking "online status" simultaneously creates a massive WebSocket broadcast load.
*   **Feed Contention**: 10k users hitting the `campus_feed` table during a fest.

### 2. WebSocket Scaling Limits
*   Requires Sticky Sessions for WebSocket load balancing at the ingress. Realtime node memory usage for presence tracking peaks.

### 3. Database Read/Write Stress
*   1,000 writes/min (16 TPS). Manageable. However, Read-heavy feed requests might require a **Redis Cache Layer** to avoid hitting Postgres for every "Get Feed" request.

### 4. Mitigation Strategies
*   **Message Batching**: Front-end should batch sync updates every 2-3 seconds instead of immediate pushes.
*   **Horizontal Scaling**: Spin up 2 additional API nodes.

---

## Scenario C: Multi-Campus Regional Expansion (Enterprise)
*   **Scale**: 5 Campuses | 100,000 Total Users | 5,000 msg/min | 500 Voice | 2,000 Feed Reads/min.

### 1. Bottleneck Analysis
*   **Global vs. Local State**: Cross-campus messages vs. Intra-campus messages.
*   **Voice/Signaling**: 500 concurrent voice connections will saturate a single TURN/STUN server cluster.

### 2. Database Read/Write Stress
*   5,000 writes/min (~83 TPS). Postgres enters "Moderate Load" zone. **Table Sharding by OrgId (CampusId)** is now MANDATORY to prevent index bloat.

### 3. Memory Leak Risk
*   Presence tracking in the Realtime worker. If not cleaned up, 100k "leaving/joining" events can grow memory consumption indefinitely.

### 4. Required Infra Upgrades
*   **Postgres Read Replicas**: Direct all Feed Reads to replicas.
*   **Global CDN**: Required for media assets to prevent egress cost explosion and latency.
*   **Distributed Realtime**: InsForge Realtime must run in a cluster with Pub/Sub (Redis) backplane.

---

## Mitigation Summary Table

| Strategy | Component | Implementation |
| :--- | :--- | :--- |
| **Horizontal Scaling** | API / Realtime | K8s HPA based on CPU/Conn count |
| **Sharding** | Database | Partition by `campus_id` |
| **Message Batching** | Frontend | Queue messages in Zustand, flush every 2s |
| **CDN Offload** | Storage | S3/Cloudflare R2 + Cloudflare CDN |
| **Load Balancing** | Gateway | Nginx/HAProxy with Least-Conn algorithm |
