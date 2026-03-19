import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileEditor } from './file-editor';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe('FileEditor', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders readonly mode for non-controller sessions', () => {
    render(
      <FileEditor
        workspaceId="workspace-1"
        path="README.md"
        initialContents="# Pocket Agent"
        editable={false}
      />,
    );

    expect(screen.getByText('read only')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Save file' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('saves file content through the web proxy', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'saved' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    render(
      <FileEditor
        workspaceId="workspace-1"
        path="README.md"
        initialContents="# Pocket Agent"
        editable
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value: '# Pocket Agent\n\nUpdated',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save file' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/host/workspaces/workspace-1/file',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            path: 'README.md',
            contents: '# Pocket Agent\n\nUpdated',
          }),
        },
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
