import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should prioritize critical components during recovery', async () => {
    const mockResponse = {
      data: {
        prioritization: {
          criticalComponents: ['auth_service', 'data_store', 'prediction_engine'],
          executionOrder: [
            { component: 'auth_service', priority: 'critical', recoveryTime: 800 },
            { component: 'data_store', priority: 'critical', recoveryTime: 1200 },
            { component: 'prediction_engine', priority: 'critical', recoveryTime: 1500 },
            { component: 'monitoring', priority: 'high', recoveryTime: 2000 },
            { component: 'logging', priority: 'medium', recoveryTime: 2500 }
          ],
          resourceAllocation: {
            cpu: { critical: 80, high: 15, medium: 5 },
            memory: { critical: 75, high: 20, medium: 5 }
          }
        },
        outcome: {
          criticalServicesRestored: true,
          totalRecoveryTime: 3500,
          serviceStability: 'achieved'
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/recovery-priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: 'perf-predictor-v1',
        priorityConfig: {
          criticalTimeThreshold: 2000,
          resourceQuotas: true,
          failFast: true
        }
      })
    })
    const data = await response.json()

    expect(data.data.prioritization.criticalComponents).toHaveLength(3)
    expect(data.data.outcome.criticalServicesRestored).toBe(true)
  })

  it('should establish and validate performance baselines', async () => {
    const mockResponse = {
      data: {
        baseline: {
          timestamp: new Date().toISOString(),
          metrics: {
            responseTime: {
              p50: 100,
              p90: 150,
              p99: 200
            },
            throughput: {
              average: 1000,
              peak: 1500
            },
            resourceUsage: {
              cpu: { average: 60, peak: 80 },
              memory: { average: 70, peak: 85 }
            }
          },
          confidence: 0.95
        },
        validation: {
          status: 'valid',
          deviations: []
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/establish-baseline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration: '24h',
        sampleRate: '1m'
      })
    })
    const data = await response.json()

    expect(data.data.baseline.confidence).toBeGreaterThan(0.9)
    expect(data.data.validation.status).toBe('valid')
  })

  it('should detect performance regression against baseline', async () => {
    const mockResponse = {
      data: {
        regression: {
          detected: true,
          metrics: {
            responseTime: {
              current: { p99: 250 },
              baseline: { p99: 200 },
              deviation: 25
            },
            throughput: {
              current: { average: 900 },
              baseline: { average: 1000 },
              deviation: -10
            }
          },
          impact: {
            severity: 'medium',
            affectedUsers: '15%'
          }
        },
        analysis: {
          cause: 'increased_load',
          recommendations: ['scale_resources', 'optimize_queries']
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/check-regression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comparisonWindow: '1h',
        threshold: { deviation: 20 }
      })
    })
    const data = await response.json()

    expect(data.data.regression.detected).toBe(true)
    expect(data.data.regression.metrics.responseTime.deviation).toBeGreaterThan(20)
  })

  it('should update performance baselines adaptively', async () => {
    const mockResponse = {
      data: {
        adaptation: {
          triggered: true,
          reason: 'sustained_improvement',
          changes: {
            responseTime: {
              old: { p99: 200 },
              new: { p99: 180 },
              improvement: '10%'
            },
            throughput: {
              old: { average: 1000 },
              new: { average: 1200 },
              improvement: '20%'
            }
          }
        },
        verification: {
          samples: 1000,
          confidence: 0.98,
          stability: 'confirmed'
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/adapt-baseline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adaptationPeriod: '7d',
        minImprovement: '10%'
      })
    })
    const data = await response.json()

    expect(data.data.adaptation.triggered).toBe(true)
    expect(data.data.verification.confidence).toBeGreaterThan(0.95)
  })
  it('should maintain service levels during prioritized recovery', async () => {
    const mockResponse = {
      data: {
        serviceLevels: {
          critical: { availability: 99.9, performance: 'optimal' },
          high: { availability: 99.5, performance: 'degraded' },
          medium: { availability: 98.0, performance: 'reduced' }
        },
        resourceBalance: {
          distribution: 'optimal',
          bottlenecks: [],
          headroom: { cpu: 15, memory: 20 }
        },
        stability: {
          metrics: {
            errorRate: 0.001,
            latency: { p95: 150, p99: 200 },
            throughput: 'sustained'
          },
          assessment: 'stable'
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/service-levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: 'perf-predictor-v1',
        serviceLevelTargets: {
          critical: { minAvailability: 99.9 },
          high: { minAvailability: 99.0 },
          medium: { minAvailability: 95.0 }
        }
      })
    })
    const data = await response.json()

    expect(data.data.serviceLevels.critical.availability).toBeGreaterThan(99.8)
    expect(data.data.stability.assessment).toBe('stable')
  })

  it('should handle model synchronization failures gracefully', async () => {
    const mockResponse = {
      data: {
        error: {
          type: 'sync_failure',
          code: 'MODEL_SYNC_ERROR',
          affectedExperiments: ['exp-3'],
          details: {
            failurePoint: 'data_migration',
            recoveryStatus: 'partial',
            rollbackSuccessful: true
          }
        },
        recovery: {
          actions: ['model_rollback', 'data_restore'],
          status: 'completed',
          impactMinimized: true
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/sync-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: 'perf-predictor-v1',
        targetExperiments: ['exp-1', 'exp-2', 'exp-3'],
        syncStrategy: 'atomic'
      })
    })
    const data = await response.json()

    expect(data.data.error.type).toBe('sync_failure')
    expect(data.data.recovery.status).toBe('completed')
  })

  it('should detect and handle data inconsistencies', async () => {
    const mockResponse = {
      data: {
        validation: {
          status: 'failed',
          inconsistencies: [
            {
              type: 'data_mismatch',
              severity: 'high',
              location: 'feature_store',
              details: 'Version mismatch in feature definitions'
            }
          ],
          impact: {
            experiments: ['exp-2'],
            predictions: 'potentially_affected'
          }
        },
        mitigation: {
          automatic: {
            applied: true,
            successful: true,
            actions: ['feature_version_sync']
          },
          manual: {
            required: false,
            suggestions: []
          }
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/validate-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentIds: ['exp-1', 'exp-2'],
        validationDepth: 'comprehensive'
      })
    })
    const data = await response.json()

    expect(data.data.validation.status).toBe('failed')
    expect(data.data.mitigation.automatic.successful).toBe(true)
  })

  it('should handle network connectivity issues', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    try {
      await fetch('/api/experiments/integration/recovery-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'perf-predictor-v1',
          retryConfig: {
            maxAttempts: 3,
            backoffMs: 1000
          }
        })
      })
    } catch (error) {
      expect(error.message).toBe('Network error')
    }
  })

  it('should handle partial network responses', async () => {
    const mockResponse = {
      data: {
        networkStatus: {
          type: 'partial_connectivity',
          affectedServices: ['prediction_engine'],
          fallbackMode: 'enabled',
          retryStatus: {
            attempts: 2,
            nextRetryMs: 1000
          }
        },
        degradedOperation: {
          active: true,
          capabilities: {
            available: ['basic_predictions'],
            unavailable: ['advanced_analytics']
          }
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 206,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/network-status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()

    expect(data.data.networkStatus.type).toBe('partial_connectivity')
    expect(data.data.degradedOperation.active).toBe(true)
  })

  it('should recover from connection timeouts', async () => {
    const mockResponse = {
      data: {
        reconnection: {
          successful: true,
          attempts: 2,
          duration: 3000,
          services: {
            restored: ['auth_service', 'data_store'],
            pending: []
          }
        },
        stateRecovery: {
          status: 'completed',
          dataIntegrity: 'maintained'
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/reconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reconnectStrategy: 'progressive',
        timeout: 5000
      })
    })
    const data = await response.json()

    expect(data.data.reconnection.successful).toBe(true)
    expect(data.data.stateRecovery.status).toBe('completed')
  })

  it('should handle DNS resolution failures', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('DNS resolution failed')))

    try {
      await fetch('/api/experiments/integration/service-discovery', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      expect(error.message).toBe('DNS resolution failed')
    }
  })

  it('should handle service unavailability with circuit breaker', async () => {
    const mockResponse = {
      data: {
        circuitBreaker: {
          status: 'open',
          triggeredBy: 'consecutive_failures',
          failureCount: 5,
          cooldownPeriod: 30000
        },
        fallbackResponse: {
          source: 'cache',
          timestamp: new Date().toISOString(),
          validity: 'degraded'
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/model-service', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()

    expect(data.data.circuitBreaker.status).toBe('open')
    expect(data.data.fallbackResponse.source).toBe('cache')
  })

  it('should handle network latency degradation', async () => {
    const mockResponse = {
      data: {
        performance: {
          latencyMs: 5000,
          threshold: 1000,
          degradationDetected: true
        },
        adaptation: {
          strategy: 'request_throttling',
          applied: true,
          impact: {
            requestsThrottled: 25,
            serviceStability: 'maintained'
          }
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/network-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monitoringPeriod: '5m',
        thresholds: { latencyMs: 1000 }
      })
    })
    const data = await response.json()

    expect(data.data.performance.degradationDetected).toBe(true)
    expect(data.data.adaptation.strategy).toBe('request_throttling')
  })
  it('should verify all required service dependencies', async () => {
    const mockResponse = {
      data: {
        dependencies: {
          status: 'verified',
          services: {
            database: { status: 'connected', latency: 20 },
            cache: { status: 'connected', latency: 5 },
            queue: { status: 'connected', latency: 15 },
            storage: { status: 'connected', latency: 25 }
          },
          external: {
            auth: { status: 'connected', provider: 'oauth2' },
            metrics: { status: 'connected', provider: 'prometheus' }
          }
        },
        verification: {
          completeness: true,
          timestamp: new Date().toISOString()
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/verify-dependencies', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()

    expect(data.data.dependencies.status).toBe('verified')
    expect(Object.keys(data.data.dependencies.services)).toHaveLength(4)
  })

  it('should handle cascading dependency failures', async () => {
    const mockResponse = {
      data: {
        failure: {
          primary: {
            service: 'database',
            error: 'connection_timeout',
            timestamp: new Date().toISOString()
          },
          cascade: {
            affected: ['cache', 'queue'],
            unaffected: ['storage'],
            propagationPath: ['database', 'cache', 'queue']
          }
        },
        recovery: {
          strategy: 'isolation',
          steps: ['failover_db', 'restart_cache', 'clear_queue'],
          estimated_time: 120
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/dependency-failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'database',
        failureType: 'connection_timeout'
      })
    })
    const data = await response.json()

    expect(data.data.failure.cascade.affected).toHaveLength(2)
    expect(data.data.recovery.strategy).toBe('isolation')
  })

  it('should manage dependency version compatibility', async () => {
    const mockResponse = {
      data: {
        versions: {
          current: {
            database: 'v5.2.1',
            cache: 'v2.1.0',
            queue: 'v3.0.5'
          },
          required: {
            database: '^5.2.0',
            cache: '^2.0.0',
            queue: '^3.0.0'
          },
          compatibility: {
            status: 'compatible',
            warnings: ['cache_update_recommended']
          }
        },
        analysis: {
          riskLevel: 'low',
          recommendations: ['update_cache_to_v2.2.0']
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/version-check', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()

    expect(data.data.versions.compatibility.status).toBe('compatible')
    expect(data.data.analysis.riskLevel).toBe('low')
  })
  it('should monitor dependency health metrics in real-time', async () => {
    const mockResponse = {
      data: {
        monitoring: {
          timestamp: new Date().toISOString(),
          metrics: {
            database: {
              connections: 150,
              queryLatency: 25,
              errorRate: 0.001,
              cpuUsage: 65
            },
            cache: {
              hitRate: 0.95,
              memoryUsage: 75,
              evictionRate: 0.02
            },
            queue: {
              depth: 100,
              processingRate: 50,
              backlogSize: 10
            }
          },
          alerts: {
            active: false,
            thresholds: {
              queryLatency: 50,
              errorRate: 0.01,
              memoryUsage: 90
            }
          }
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/monitor-dependencies', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()

    expect(data.data.monitoring.metrics.database.errorRate).toBeLessThan(0.01)
    expect(data.data.monitoring.alerts.active).toBe(false)
  })

  it('should track dependency performance trends', async () => {
    const mockResponse = {
      data: {
        trends: {
          period: '1h',
          intervals: 12,
          metrics: {
            database: {
              latencyTrend: [20, 22, 25, 21, 19, 23, 24, 22, 21, 20, 21, 25],
              errorTrend: [0.001, 0.001, 0.002, 0.001, 0.001, 0.001]
            },
            cache: {
              hitRateTrend: [0.95, 0.94, 0.93, 0.95, 0.96, 0.95],
              usageTrend: [70, 72, 75, 73, 71, 74]
            }
          },
          analysis: {
            stability: 'high',
            degradationDetected: false
          }
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/dependency-trends', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeRange: '1h',
        resolution: '5m'
      })
    })
    const data = await response.json()

    expect(data.data.trends.analysis.stability).toBe('high')
    expect(data.data.trends.metrics.database.latencyTrend).toHaveLength(12)
  })

  it('should detect dependency performance anomalies', async () => {
    const mockResponse = {
      data: {
        anomalies: {
          detected: true,
          services: {
            database: {
              metric: 'queryLatency',
              current: 45,
              baseline: 25,
              deviation: 80,
              severity: 'warning'
            }
          },
          context: {
            timeWindow: '15m',
            samplesAnalyzed: 180
          }
        },
        recommendations: {
          immediate: ['scale_connection_pool'],
          scheduled: ['optimize_queries']
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/anomaly-detection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monitoringWindow: '15m',
        sensitivity: 'medium'
      })
    })
    const data = await response.json()

    expect(data.data.anomalies.detected).toBe(true)
    expect(data.data.recommendations.immediate).toContain('scale_connection_pool')
  })

  it('should notify stakeholders of baseline violations', async () => {
    const mockResponse = {
      data: {
        notification: {
          type: 'baseline_violation',
          severity: 'high',
          timestamp: new Date().toISOString(),
          details: {
            metric: 'response_time',
            threshold: 200,
            current: 350,
            deviation: '75%'
          },
          distribution: {
            affected_services: ['api_gateway', 'user_service'],
            impact_level: 'critical'
          }
        },
        alerts: {
          channels: ['email', 'slack', 'pagerduty'],
          recipients: ['sre_team', 'service_owners'],
          status: 'delivered'
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/baseline-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        violationType: 'threshold_breach',
        notificationConfig: {
          channels: ['email', 'slack', 'pagerduty'],
          escalationLevel: 'high'
        }
      })
    })
    const data = await response.json()

    expect(data.data.notification.severity).toBe('high')
    expect(data.data.alerts.status).toBe('delivered')
  })

  it('should aggregate baseline notifications for reporting', async () => {
    const mockResponse = {
      data: {
        report: {
          period: '24h',
          violations: {
            total: 5,
            byService: {
              api_gateway: 3,
              user_service: 2
            },
            bySeverity: {
              high: 2,
              medium: 2,
              low: 1
            }
          },
          trends: {
            frequency: 'increasing',
            commonPatterns: ['peak_hours', 'data_sync']
          }
        },
        actions: {
          automated: ['scale_up', 'cache_flush'],
          required: ['review_thresholds', 'optimize_queries']
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/baseline-reports', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()

    expect(data.data.report.violations.total).toBe(5)
    expect(data.data.actions.automated).toContain('scale_up')
  })

  it('should handle notification delivery failures', async () => {
    const mockResponse = {
      data: {
        delivery: {
          status: 'partial_failure',
          attempts: 3,
          successful: ['email', 'slack'],
          failed: ['pagerduty'],
          errors: [{
            channel: 'pagerduty',
            error: 'api_timeout',
            retryScheduled: true
          }],
          fallback: {
            activated: true,
            method: 'sms',
            status: 'delivered'
          }
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 207,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/notification-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: 'baseline-alert-123',
        retryConfig: { maxAttempts: 3 }
      })
    })
    const data = await response.json()

    expect(data.data.delivery.status).toBe('partial_failure')
    expect(data.data.delivery.fallback.status).toBe('delivered')
  })

  it('should manage user notification preferences', async () => {
    const mockResponse = {
      data: {
        preferences: {
          channels: {
            email: { enabled: true, priority: ['critical', 'high'] },
            slack: { enabled: true, priority: ['critical', 'high', 'medium'] },
            sms: { enabled: true, priority: ['critical'] }
          },
          schedule: {
            quietHours: { start: '22:00', end: '07:00' },
            timezone: 'UTC'
          },
          filters: {
            services: ['database', 'api_gateway'],
            excludedTypes: ['info', 'debug']
          }
        },
        validation: {
          status: 'success',
          effectiveFrom: new Date().toISOString()
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/notification-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-123',
        preferences: {
          channels: ['email', 'slack', 'sms'],
          priorityLevels: ['critical', 'high']
        }
      })
    })
    const data = await response.json()

    expect(data.data.preferences.channels.email.enabled).toBe(true)
    expect(data.data.validation.status).toBe('success')
  })

  it('should validate notification preference updates', async () => {
    const mockResponse = {
      data: {
        validation: {
          status: 'failed',
          errors: [
            {
              field: 'channels.webhook',
              error: 'invalid_endpoint',
              details: 'Webhook URL is not accessible'
            }
          ],
          suggestions: [
            'Verify webhook endpoint availability',
            'Check endpoint authentication'
          ]
        },
        currentPreferences: {
          maintained: true,
          lastValidUpdate: new Date(Date.now() - 86400000).toISOString()
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/validate-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-123',
        updates: {
          addChannel: {
            type: 'webhook',
            endpoint: 'https://example.com/webhook'
          }
        }
      })
    })
    const data = await response.json()

    expect(data.data.validation.status).toBe('failed')
    expect(data.data.currentPreferences.maintained).toBe(true)
  })

  it('should handle notification preference conflicts', async () => {
    const mockResponse = {
      data: {
        conflicts: {
          detected: true,
          details: [
            {
              type: 'channel_overlap',
              channels: ['slack', 'teams'],
              resolution: 'auto_merged'
            }
          ],
          resolution: {
            strategy: 'merge',
            outcome: 'success',
            appliedChanges: ['unified_slack_channel']
          }
        },
        finalPreferences: {
          channels: {
            slack: { enabled: true, primary: true },
            teams: { enabled: false, migrated: true }
          }
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/integration/resolve-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-123',
        resolutionStrategy: 'auto'
      })
    })
    const data = await response.json()

    expect(data.data.conflicts.resolution.outcome).toBe('success')
    expect(data.data.finalPreferences.channels.slack.primary).toBe(true)
  })
})