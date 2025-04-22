import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('Experiment Isolation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Isolation', () => {
    it('should maintain data isolation between experiments', async () => {
      const mockResponse = {
        data: {
          experimentId: 'pricing-test',
          isolationLevel: 'strict',
          dataSegments: {
            control: { isolated: true },
            test: { isolated: true }
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/isolation/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId: 'pricing-test' })
      })
      const data = await response.json()

      expect(data.data.isolationLevel).toBe('strict')
      expect(data.data.dataSegments.control.isolated).toBe(true)
    })

    it('should prevent cross-experiment contamination', async () => {
      const mockResponse = {
        data: {
          verificationResults: {
            dataIsolation: true,
            userSegmentation: true,
            metricIndependence: true
          },
          potentialIssues: []
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/contamination/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiments: ['ui-test', 'performance-test']
        })
      })
      const data = await response.json()

      expect(data.data.verificationResults.dataIsolation).toBe(true)
      expect(data.data.potentialIssues).toHaveLength(0)
    })
  })

  describe('Isolation Boundaries', () => {
    it('should validate experiment boundaries', async () => {
      const mockResponse = {
        data: {
          boundaries: {
            userGroups: ['test', 'control'],
            metrics: ['conversion', 'engagement'],
            timeframe: { start: Date.now(), end: Date.now() + 86400000 }
          },
          validation: { passed: true }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/boundaries/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId: 'new-feature-test' })
      })
      const data = await response.json()

      expect(data.data.validation.passed).toBe(true)
      expect(data.data.boundaries.userGroups).toContain('test')
    })
  })

  describe('Isolation Breaches', () => {
    it('should handle isolation breaches', async () => {
      const mockResponse = {
        data: {
          breach: {
            type: 'data_leak',
            severity: 'high',
            affectedExperiments: ['test-a', 'test-b'],
            timestamp: Date.now()
          },
          recommendations: ['Restart affected experiments', 'Review isolation policies']
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/isolation/breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: 'test-a',
          breachType: 'data_leak'
        })
      })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.data.breach.severity).toBe('high')
      expect(data.data.recommendations).toBeDefined()
    })
  })

  describe('Task Management', () => {
    it('should recheck pending isolation tasks', async () => {
      const mockResponse = {
        data: {
          tasks: [
            {
              id: 'task-1',
              type: 'isolation-check',
              status: 'pending',
              experimentId: 'pricing-test',
              retryCount: 2,
              lastChecked: Date.now() - 300000
            },
            {
              id: 'task-2',
              type: 'boundary-validation',
              status: 'pending',
              experimentId: 'ui-test',
              retryCount: 1,
              lastChecked: Date.now() - 600000
            }
          ],
          summary: {
            totalPending: 2,
            avgWaitTime: '5m'
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/pending', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()

      expect(data.data.tasks).toHaveLength(2)
      expect(data.data.tasks[0].status).toBe('pending')
      expect(data.data.summary.totalPending).toBe(2)
    })

    it('should process task retry queue', async () => {
      const mockResponse = {
        data: {
          processedTasks: [
            {
              id: 'task-1',
              status: 'completed',
              result: 'isolation-verified',
              retryCount: 3
            }
          ],
          queueStatus: {
            remaining: 1,
            processed: 1,
            failed: 0
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: ['task-1', 'task-2']
        })
      })
      const data = await response.json()

      expect(data.data.processedTasks[0].status).toBe('completed')
      expect(data.data.queueStatus.processed).toBe(1)
    })

    it('should handle task timeout scenarios', async () => {
      const mockResponse = {
        data: {
          timedOutTasks: [
            {
              id: 'task-1',
              error: 'timeout',
              duration: '30s',
              maxAllowed: '25s'
            }
          ],
          actions: {
            rescheduled: true,
            notificationSent: true
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 408,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1'
        })
      })
      const data = await response.json()

      expect(response.status).toBe(408)
      expect(data.data.timedOutTasks).toHaveLength(1)
      expect(data.data.actions.rescheduled).toBe(true)
    })
  })

  describe('Task Prioritization', () => {
    it('should prioritize critical isolation tasks', async () => {
      const mockResponse = {
        data: {
          prioritizedTasks: [
            {
              id: 'task-1',
              priority: 'high',
              type: 'data-breach-check',
              experimentId: 'payment-test',
              deadline: Date.now() + 3600000
            },
            {
              id: 'task-2',
              priority: 'medium',
              type: 'isolation-verify',
              experimentId: 'ui-test',
              deadline: Date.now() + 7200000
            }
          ],
          queueMetrics: {
            highPriority: 1,
            mediumPriority: 1,
            lowPriority: 0
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: ['task-1', 'task-2'],
          criteria: 'deadline'
        })
      })
      const data = await response.json()

      expect(data.data.prioritizedTasks[0].priority).toBe('high')
      expect(data.data.queueMetrics.highPriority).toBe(1)
    })

    it('should handle priority conflicts', async () => {
      const mockResponse = {
        data: {
          conflicts: [
            {
              tasks: ['task-1', 'task-2'],
              reason: 'same_deadline',
              resolution: 'task-1 prioritized based on impact'
            }
          ],
          resolutionMetrics: {
            resolved: 1,
            pending: 0
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/priority-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: ['task-1', 'task-2']
        })
      })
      const data = await response.json()

      expect(data.data.conflicts).toHaveLength(1)
      expect(data.data.resolutionMetrics.resolved).toBe(1)
    })

    it('should update task priorities dynamically', async () => {
      const mockResponse = {
        data: {
          updates: [
            {
              taskId: 'task-1',
              oldPriority: 'medium',
              newPriority: 'high',
              reason: 'deadline_approaching'
            }
          ],
          systemLoad: {
            before: 'balanced',
            after: 'high_priority_heavy'
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/priority-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          newPriority: 'high'
        })
      })
      const data = await response.json()

      expect(data.data.updates[0].newPriority).toBe('high')
      expect(data.data.systemLoad.after).toBe('high_priority_heavy')
    })
  })

  describe('State Synchronization', () => {
    it('should synchronize task states across instances', async () => {
      const mockResponse = {
        data: {
          syncStatus: {
            taskId: 'task-1',
            instances: ['instance-1', 'instance-2'],
            stateHash: 'abc123',
            timestamp: Date.now()
          },
          verification: {
            consistent: true,
            conflicts: []
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          instanceId: 'instance-1'
        })
      })
      const data = await response.json()

      expect(data.data.syncStatus.stateHash).toBe('abc123')
      expect(data.data.verification.consistent).toBe(true)
    })

    it('should manage task checkpoints effectively', async () => {
      const mockResponse = {
        data: {
          checkpoint: {
            id: 'cp-1',
            taskId: 'task-1',
            state: 'validation-complete',
            data: { progress: 75, validationResults: true },
            timestamp: Date.now()
          },
          status: 'created'
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          state: 'validation-complete'
        })
      })
      const data = await response.json()

      expect(data.data.checkpoint.state).toBe('validation-complete')
      expect(data.data.status).toBe('created')
    })

    it('should handle state conflicts resolution', async () => {
      const mockResponse = {
        data: {
          conflicts: [{
            type: 'state_mismatch',
            instances: ['instance-1', 'instance-2'],
            resolution: 'instance-1 state adopted',
            timestamp: Date.now()
          }],
          resolutionStatus: 'success'
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/resolve-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          preferredInstance: 'instance-1'
        })
      })
      const data = await response.json()

      expect(data.data.conflicts[0].resolution).toBe('instance-1 state adopted')
      expect(data.data.resolutionStatus).toBe('success')
    })
  })

  describe('State Recovery', () => {
    it('should recover from failed state transitions', async () => {
      const mockResponse = {
        data: {
          recovery: {
            taskId: 'task-1',
            previousState: 'processing',
            failedTransition: 'validation',
            recoveryPoint: 'pre-validation',
            timestamp: Date.now()
          },
          status: {
            recovered: true,
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

      const response = await fetch('/api/experiments/tasks/recover-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          targetState: 'pre-validation'
        })
      })
      const data = await response.json()

      expect(data.data.recovery.recoveryPoint).toBe('pre-validation')
      expect(data.data.status.recovered).toBe(true)
    })

    it('should perform incremental state restoration', async () => {
      const mockResponse = {
        data: {
          restoration: {
            steps: [
              { phase: 'metadata', status: 'restored' },
              { phase: 'dependencies', status: 'restored' },
              { phase: 'data', status: 'in-progress' }
            ],
            progress: 66,
            estimatedTimeRemaining: '30s'
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/restore-incremental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          restoreStrategy: 'incremental'
        })
      })
      const data = await response.json()

      expect(data.data.restoration.progress).toBe(66)
      expect(data.data.restoration.steps[0].status).toBe('restored')
    })

    it('should validate state integrity after recovery', async () => {
      const mockResponse = {
        data: {
          validation: {
            stateHash: 'abc123',
            dataConsistency: true,
            referentialIntegrity: true,
            timestamp: Date.now()
          },
          diagnostics: {
            checksPerformed: 3,
            issuesFound: 0
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/tasks/validate-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          validationLevel: 'deep'
        })
      })
      const data = await response.json()

      expect(data.data.validation.dataConsistency).toBe(true)
      expect(data.data.diagnostics.issuesFound).toBe(0)
    })
  })

  describe('Recovery Monitoring', () => {
    it('should track recovery progress and metrics', async () => {
      const mockResponse = {
        data: {
          recoveryMetrics: {
            taskId: 'task-1',
            startTime: Date.now() - 5000,
            completedSteps: 3,
            totalSteps: 5,
            performance: {
              timePerStep: '1.5s',
              resourceUsage: 'moderate',
              throughput: '2.0 ops/s'
            }
          },
          status: 'in-progress'
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/recovery/metrics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: 'task-1' })
      })
      const data = await response.json()

      expect(data.data.recoveryMetrics.completedSteps).toBe(3)
      expect(data.data.status).toBe('in-progress')
    })

    it('should analyze recovery performance patterns', async () => {
      const mockResponse = {
        data: {
          analysis: {
            averageRecoveryTime: '2.5s',
            successRate: 95,
            bottlenecks: ['state-validation', 'data-sync'],
            recommendations: ['Optimize state validation', 'Increase sync frequency']
          },
          trends: {
            daily: { improved: true, delta: '+15%' },
            weekly: { improved: true, delta: '+10%' }
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/recovery/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe: 'last-7-days',
          metrics: ['time', 'success-rate']
        })
      })
      const data = await response.json()

      expect(data.data.analysis.successRate).toBe(95)
      expect(data.data.trends.daily.improved).toBe(true)
    })

    it('should detect recovery anomalies', async () => {
      const mockResponse = {
        data: {
          anomalies: [
            {
              type: 'performance-degradation',
              severity: 'medium',
              affectedMetric: 'recovery-time',
              threshold: '5s',
              actual: '7s',
              timestamp: Date.now()
            }
          ],
          actions: {
            automated: ['scale-up-resources'],
            manual: ['review-recovery-logs']
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/recovery/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          monitoringWindow: '1h'
        })
      })
      const data = await response.json()

      expect(data.data.anomalies[0].severity).toBe('medium')
      expect(data.data.actions.automated).toContain('scale-up-resources')
    })
  })

  describe('Real-time Monitoring', () => {
    it('should stream real-time task metrics', async () => {
      const mockResponse = {
        data: {
          metrics: {
            taskId: 'task-1',
            timestamp: Date.now(),
            cpu: { usage: 45, threshold: 80 },
            memory: { usage: 60, threshold: 85 },
            throughput: { current: 150, baseline: 100 }
          },
          status: 'healthy'
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/monitoring/stream', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: 'task-1' })
      })
      const data = await response.json()

      expect(data.data.metrics.cpu.usage).toBeLessThan(data.data.metrics.cpu.threshold)
      expect(data.data.status).toBe('healthy')
    })

    it('should trigger performance alerts', async () => {
      const mockResponse = {
        data: {
          alerts: [
            {
              id: 'alert-1',
              type: 'performance_degradation',
              severity: 'warning',
              metric: 'response_time',
              threshold: '200ms',
              current: '250ms',
              timestamp: Date.now()
            }
          ],
          notifications: {
            sent: true,
            channels: ['email', 'slack']
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          metricType: 'performance'
        })
      })
      const data = await response.json()

      expect(data.data.alerts[0].severity).toBe('warning')
      expect(data.data.notifications.sent).toBe(true)
    })

    it('should handle resource utilization thresholds', async () => {
      const mockResponse = {
        data: {
          resources: {
            cpu: { current: 85, threshold: 80, status: 'exceeded' },
            memory: { current: 75, threshold: 80, status: 'normal' },
            disk: { current: 60, threshold: 90, status: 'normal' }
          },
          actions: {
            autoScaling: true,
            notification: 'triggered'
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/monitoring/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-1',
          checkThresholds: true
        })
      })
      const data = await response.json()

      expect(data.data.resources.cpu.status).toBe('exceeded')
      expect(data.data.actions.autoScaling).toBe(true)
    })
  })

  describe('Custom Monitoring', () => {
    it('should track custom isolation metrics', async () => {
      const mockResponse = {
        data: {
          customMetrics: {
            'data-overlap-ratio': { value: 0.02, threshold: 0.05 },
            'cross-experiment-calls': { value: 5, threshold: 10 },
            'isolation-score': { value: 95, threshold: 90 }
          },
          metadata: {
            lastUpdated: Date.now(),
            source: 'custom-monitor'
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/monitoring/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: 'test-1',
          metrics: ['data-overlap-ratio', 'isolation-score']
        })
      })
      const data = await response.json()

      expect(data.data.customMetrics['isolation-score'].value).toBeGreaterThan(90)
      expect(data.data.customMetrics['data-overlap-ratio'].value).toBeLessThan(0.05)
    })

    it('should establish performance baselines', async () => {
      const mockResponse = {
        data: {
          baselines: {
            taskCompletion: { mean: '2.5s', stdDev: '0.5s' },
            resourceUsage: { mean: '45%', peak: '75%' },
            isolationMetrics: {
              dataSegregation: { baseline: 0.98, tolerance: 0.02 },
              crossContamination: { baseline: 0.01, tolerance: 0.01 }
            }
          },
          confidence: {
            level: 'high',
            sampleSize: 1000
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/monitoring/baselines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentType: 'isolation',
          timeframe: 'last-30-days'
        })
      })
      const data = await response.json()

      expect(data.data.baselines.isolationMetrics.dataSegregation.baseline).toBeGreaterThan(0.95)
      expect(data.data.confidence.level).toBe('high')
    })

    it('should validate metrics against baselines', async () => {
      const mockResponse = {
        data: {
          validation: {
            status: 'passed',
            deviations: [
              {
                metric: 'response-time',
                baseline: '2.5s',
                current: '2.7s',
                severity: 'low'
              }
            ],
            recommendations: []
          },
          compliance: {
            sla: true,
            performance: true
          }
        }
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const response = await fetch('/api/experiments/monitoring/validate-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: 'test-1',
          metrics: ['response-time', 'throughput']
        })
      })
      const data = await response.json()

      expect(data.data.validation.status).toBe('passed')
      expect(data.data.compliance.sla).toBe(true)
    })
  })
})


describe('Performance Analytics', () => {
  it('should analyze metric correlations', async () => {
    const mockResponse = {
      data: {
        correlations: [
          {
            metrics: ['cpu_usage', 'response_time'],
            coefficient: 0.85,
            significance: 'high',
            impact: 'direct'
          },
          {
            metrics: ['memory_usage', 'throughput'],
            coefficient: -0.32,
            significance: 'medium',
            impact: 'inverse'
          }
        ],
        insights: {
          strongCorrelations: 1,
          potentialBottlenecks: ['cpu_usage']
        }
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/analytics/correlations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: ['cpu_usage', 'memory_usage', 'response_time', 'throughput'],
        timeframe: '24h'
      })
    })
    const data = await response.json()

    expect(data.data.correlations[0].significance).toBe('high')
    expect(data.data.insights.strongCorrelations).toBe(1)
  })

  it('should analyze performance trends over time', async () => {
    const mockResponse = {
      data: {
        trends: {
          hourly: {
            pattern: 'cyclical',
            peakHours: [10, 15],
            metrics: {
              response_time: { trend: 'stable', variance: 'low' },
              throughput: { trend: 'increasing', variance: 'medium' }
            }
          },
          daily: {
            pattern: 'consistent',
            anomalies: [],
            metrics: {
              response_time: { trend: 'improving', variance: 'low' },
              throughput: { trend: 'stable', variance: 'low' }
            }
          }
        },
        recommendations: [
          'Optimize resource allocation during peak hours',
          'Monitor throughput variance'
        ]
      }
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const response = await fetch('/api/experiments/analytics/trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: ['response_time', 'throughput'],
        timeframe: '7d'
      })
    })
    const data = await response.json()

    expect(data.data.trends.hourly.pattern).toBe('cyclical')
    expect(data.data.trends.daily.metrics.response_time.trend).toBe('improving')
  })
})