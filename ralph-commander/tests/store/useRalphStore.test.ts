import { describe, it, expect, beforeEach } from 'vitest';
import { useRalphStore } from '../../src/renderer/store/useRalphStore';

describe('useRalphStore', () => {
  beforeEach(() => {
    // Reset store state manually if needed, or just rely on fresh import
    useRalphStore.setState({
      status: null,
      logs: '',
      tasks: [],
      changedFiles: [],
    });
  });

  it('should initialize with default values', () => {
    const state = useRalphStore.getState();
    expect(state.status).toBeNull();
    expect(state.logs).toBe('');
    expect(state.tasks).toEqual([]);
    expect(state.changedFiles).toEqual([]);
  });

  it('should set status', () => {
    const mockStatus = {
      active: true,
      iteration: 1,
      max_iterations: 10,
      completion_promise: 'DONE',
      started_at: '2026-01-30T00:00:00Z',
      prompt: 'test prompt',
    };
    useRalphStore.getState().setStatus(mockStatus);
    expect(useRalphStore.getState().status).toEqual(mockStatus);
  });

  it('should append logs', () => {
    useRalphStore.getState().setLogs('Initial log\n');
    useRalphStore.getState().appendLogs('New log');
    expect(useRalphStore.getState().logs).toBe('Initial log\nNew log');
  });

  it('should set tasks', () => {
    const mockTasks = [{ description: 'Task 1', completed: false }];
    useRalphStore.getState().setTasks(mockTasks);
    expect(useRalphStore.getState().tasks).toEqual(mockTasks);
  });

  it('should set changed files', () => {
    const mockFiles = [{ status: 'M', path: 'src/app.ts' }];
    useRalphStore.getState().setChangedFiles(mockFiles);
    expect(useRalphStore.getState().changedFiles).toEqual(mockFiles);
  });
});
