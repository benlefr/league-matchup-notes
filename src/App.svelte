<script>
  import { onMount } from 'svelte';
  import MatchupList from './components/MatchupList.svelte';
  import MatchupForm from './components/MatchupForm.svelte';
  import UpdateNotification from './components/UpdateNotification.svelte';

  let matchups = [];
  let selectedMatchup = null;
  let showForm = false;
  let viewMode = false;

  onMount(async () => {
    if (!window.electronAPI) {
      console.error('Electron API non disponible. Veuillez lancer l\'application avec "npm run electron:dev"');
      return;
    }
    await loadMatchups();
  });

  async function loadMatchups() {
    if (!window.electronAPI) return;
    matchups = await window.electronAPI.getMatchups();
  }

  async function handleSave(event) {
    if (!window.electronAPI) {
      alert('L\'application doit être lancée avec Electron. Utilisez "npm run electron:dev"');
      return;
    }
    const matchup = event.detail;
    try {
      if (matchup.id) {
        await window.electronAPI.updateMatchup(matchup);
      } else {
        await window.electronAPI.saveMatchup(matchup);
      }
      await loadMatchups();
      showForm = false;
      selectedMatchup = null;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du matchup');
    }
  }

  async function handleDelete(event) {
    await window.electronAPI.deleteMatchup(event.detail);
    await loadMatchups();
  }

  function handleEdit(event) {
    selectedMatchup = event.detail;
    viewMode = false;
    showForm = true;
  }

  function handleView(event) {
    selectedMatchup = event.detail;
    viewMode = true;
    showForm = true;
  }

  function handleNew() {
    selectedMatchup = null;
    viewMode = false;
    showForm = true;
  }

  function handleCancel() {
    showForm = false;
    viewMode = false;
    selectedMatchup = null;
  }

  async function handleUpdate(event) {
    if (!window.electronAPI) {
      alert('L\'application doit être lancée avec Electron. Utilisez "npm run electron:dev"');
      return;
    }
    const matchup = event.detail;
    try {
      await window.electronAPI.updateMatchup(matchup);
      await loadMatchups();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du matchup');
    }
  }
</script>

<!-- Notifications de mise à jour -->
<UpdateNotification />

<main>
  {#if !window.electronAPI}
    <div class="warning-banner">
      ⚠️ L'application doit être lancée avec Electron. Utilisez la commande : <code>npm run electron:dev</code>
    </div>
  {/if}
  
  <header>
    <h1>📋 League of Legends - Matchup Notes</h1>
    <button on:click={handleNew} class="btn-primary">
      ➕ Nouveau Matchup
    </button>
  </header>

  <div class="container">
    {#if showForm}
      <MatchupForm 
        matchup={selectedMatchup}
        readOnly={viewMode}
        on:save={handleSave}
        on:cancel={handleCancel}
      />
    {:else}
      <MatchupList 
        {matchups}
        on:view={handleView}
        on:edit={handleEdit}
        on:delete={handleDelete}
        on:update={handleUpdate}
      />
    {/if}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #0a1428 0%, #1a2332 100%);
    color: #c8d3e0;
    min-height: 100vh;
  }

  :global(*) {
    box-sizing: border-box;
  }

  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .warning-banner {
    background: rgba(255, 150, 0, 0.2);
    border: 2px solid rgba(255, 150, 0, 0.5);
    border-radius: 8px;
    padding: 15px 20px;
    margin-bottom: 20px;
    color: #ffcc66;
    text-align: center;
    font-weight: bold;
  }

  .warning-banner code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: #ffdd88;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: rgba(10, 20, 40, 0.6);
    border-radius: 10px;
    margin-bottom: 30px;
    border: 1px solid rgba(200, 170, 100, 0.2);
  }

  h1 {
    margin: 0;
    color: #c8aa6e;
    font-size: 28px;
    text-shadow: 0 0 10px rgba(200, 170, 110, 0.3);
  }

  .btn-primary {
    background: linear-gradient(135deg, #c8aa6e 0%, #a88a50 100%);
    color: #0a1428;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(200, 170, 110, 0.4);
  }

  .container {
    background: rgba(26, 35, 50, 0.8);
    border-radius: 10px;
    padding: 30px;
    border: 1px solid rgba(200, 170, 100, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
</style>
