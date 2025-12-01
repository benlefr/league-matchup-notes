<script>
  import { onMount } from 'svelte';
  
  let updateAvailable = false;
  let updateInfo = null;
  let downloading = false;
  let downloadProgress = 0;
  let updateReady = false;
  let updateError = null;

  onMount(() => {
    // Écouter les événements de mise à jour
    window.electronAPI.onUpdateAvailable((info) => {
      updateAvailable = true;
      updateInfo = info;
    });

    window.electronAPI.onDownloadProgress((progress) => {
      downloading = true;
      downloadProgress = progress.percent;
    });

    window.electronAPI.onUpdateDownloaded(() => {
      downloading = false;
      updateReady = true;
    });

    window.electronAPI.onUpdateError((error) => {
      updateError = error;
      downloading = false;
    });
  });

  function downloadUpdate() {
    window.electronAPI.downloadUpdate();
    downloading = true;
  }

  function installUpdate() {
    window.electronAPI.installUpdate();
  }

  function closeNotification() {
    updateAvailable = false;
    updateError = null;
  }

  function closeReadyNotification() {
    updateReady = false;
  }
</script>

<!-- Notification: Mise à jour disponible -->
{#if updateAvailable && !downloading && !updateReady}
  <div class="update-notification available">
    <div class="notification-content">
      <div class="notification-header">
        <span class="icon">🎉</span>
        <h3>Mise à jour disponible!</h3>
      </div>
      <p>Une nouvelle version <strong>{updateInfo?.version}</strong> est disponible.</p>
      <div class="notification-actions">
        <button class="btn-primary" on:click={downloadUpdate}>
          Télécharger
        </button>
        <button class="btn-secondary" on:click={closeNotification}>
          Plus tard
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Notification: Téléchargement en cours -->
{#if downloading}
  <div class="update-notification downloading">
    <div class="notification-content">
      <div class="notification-header">
        <span class="icon">⬇️</span>
        <h3>Téléchargement en cours...</h3>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {downloadProgress}%"></div>
      </div>
      <p class="progress-text">{downloadProgress}%</p>
    </div>
  </div>
{/if}

<!-- Notification: Mise à jour prête -->
{#if updateReady}
  <div class="update-notification ready">
    <div class="notification-content">
      <div class="notification-header">
        <span class="icon">✅</span>
        <h3>Mise à jour prête!</h3>
      </div>
      <p>La mise à jour a été téléchargée. Redémarrer maintenant?</p>
      <div class="notification-actions">
        <button class="btn-primary" on:click={installUpdate}>
          Redémarrer maintenant
        </button>
        <button class="btn-secondary" on:click={closeReadyNotification}>
          Au prochain démarrage
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Notification: Erreur -->
{#if updateError}
  <div class="update-notification error">
    <div class="notification-content">
      <div class="notification-header">
        <span class="icon">⚠️</span>
        <h3>Erreur de mise à jour</h3>
      </div>
      <p>{updateError}</p>
      <button class="btn-secondary" on:click={() => updateError = null}>
        Fermer
      </button>
    </div>
  </div>
{/if}

<style>
  .update-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 350px;
    max-width: 450px;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .update-notification.available {
    background: linear-gradient(135deg, rgba(100, 170, 100, 0.95) 0%, rgba(80, 150, 80, 0.95) 100%);
    border: 2px solid rgba(120, 200, 120, 0.5);
  }

  .update-notification.downloading {
    background: linear-gradient(135deg, rgba(100, 150, 200, 0.95) 0%, rgba(80, 130, 180, 0.95) 100%);
    border: 2px solid rgba(120, 170, 220, 0.5);
  }

  .update-notification.ready {
    background: linear-gradient(135deg, rgba(200, 170, 100, 0.95) 0%, rgba(180, 150, 80, 0.95) 100%);
    border: 2px solid rgba(220, 190, 120, 0.5);
  }

  .update-notification.error {
    background: linear-gradient(135deg, rgba(200, 100, 100, 0.95) 0%, rgba(180, 80, 80, 0.95) 100%);
    border: 2px solid rgba(220, 120, 120, 0.5);
  }

  .notification-content {
    color: white;
  }

  .notification-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .notification-header .icon {
    font-size: 28px;
  }

  .notification-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .notification-content p {
    margin: 12px 0;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.95);
  }

  .notification-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: white;
    color: #0a1428;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin: 12px 0;
  }

  .progress-fill {
    height: 100%;
    background: white;
    transition: width 0.3s ease;
    border-radius: 4px;
  }

  .progress-text {
    text-align: center;
    font-weight: 600;
    font-size: 16px;
    margin: 8px 0 0 0;
  }
</style>
