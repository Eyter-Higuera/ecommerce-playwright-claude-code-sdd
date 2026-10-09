import type { Page } from '@playwright/test';

// Records the browser dialogs a page opens (alert, confirm, prompt) and dismisses them, so a test
// can prove that injection-style input ran no script (Spec 001 RF-8, Spec 002 RF-8; plan D-8).
// Only the dialog type is kept, never its message.

export class DialogRecorder {
  /** The types of the dialogs opened since the recorder was created, in order. */
  readonly types: string[] = [];

  constructor(page: Page) {
    page.on('dialog', (dialog) => {
      this.types.push(dialog.type());
      dialog.dismiss().catch(() => undefined);
    });
  }
}
