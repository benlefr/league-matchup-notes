<script>
  import { createEventDispatcher } from 'svelte';
  import { runePaths, statShards } from '../data/runesData.js';
  import { getRuneImagePath } from '../utils/paths.js';

  export let selectedRunes = {
    primaryPath: '',
    primaryRunes: [],
    secondaryPath: '',
    secondaryRunes: [],
    shards: []
  };

  const dispatch = createEventDispatcher();

  // Déterminer le step initial en fonction des runes déjà sélectionnées
  function getInitialStep() {
    if (selectedRunes.shards && selectedRunes.shards.length > 0 && selectedRunes.shards.some(s => s)) {
      return 'shards';
    }
    if (selectedRunes.secondaryPath && selectedRunes.secondaryRunes && selectedRunes.secondaryRunes.length > 0) {
      return 'secondary-runes';
    }
    if (selectedRunes.secondaryPath) {
      return 'secondary-path';
    }
    if (selectedRunes.primaryPath && selectedRunes.primaryRunes && selectedRunes.primaryRunes.length > 0) {
      return 'primary-runes';
    }
    if (selectedRunes.primaryPath) {
      return 'primary-runes';
    }
    return 'primary-path';
  }

  let step = getInitialStep(); // primary-path, primary-runes, secondary-path, secondary-runes, shards

  function selectPrimaryPath(path) {
    selectedRunes.primaryPath = path;
    selectedRunes.primaryRunes = [];
    step = 'primary-runes';
  }

  function selectPrimaryRune(slot, rune) {
    selectedRunes.primaryRunes[slot] = rune;
    selectedRunes = selectedRunes;
  }

  $: canValidatePrimary = selectedRunes.primaryRunes[0] && 
                          selectedRunes.primaryRunes[1] && 
                          selectedRunes.primaryRunes[2] && 
                          selectedRunes.primaryRunes[3];

  function validatePrimary() {
    if (canValidatePrimary) {
      step = 'secondary-path';
    }
  }

  function selectSecondaryPath(path) {
    if (path === selectedRunes.primaryPath) return;
    selectedRunes.secondaryPath = path;
    selectedRunes.secondaryRunes = [];
    step = 'secondary-runes';
  }

  function selectSecondaryRune(slot, rune) {
    const index = selectedRunes.secondaryRunes.findIndex(r => r?.name === rune.name);
    if (index !== -1) {
      selectedRunes.secondaryRunes.splice(index, 1);
    } else if (selectedRunes.secondaryRunes.length < 2) {
      selectedRunes.secondaryRunes.push(rune);
    }
    selectedRunes = selectedRunes;
  }

  $: canValidateSecondary = selectedRunes.secondaryRunes.length === 2;

  function validateSecondary() {
    if (canValidateSecondary) {
      step = 'shards';
    }
  }

  function selectShard(category, shard) {
    const categoryIndex = category === 'offense' ? 0 : category === 'flex' ? 1 : 2;
    selectedRunes.shards[categoryIndex] = shard;
    selectedRunes = selectedRunes;
  }

  $: canFinish = selectedRunes.shards[0] && 
                 selectedRunes.shards[1] && 
                 selectedRunes.shards[2];

  function isRuneSelected(rune) {
    return selectedRunes.primaryRunes.some(r => r?.name === rune.name) ||
           selectedRunes.secondaryRunes.some(r => r?.name === rune.name);
  }

  function isShardSelected(shard, category) {
    const categoryIndex = category === 'offense' ? 0 : category === 'flex' ? 1 : 2;
    return selectedRunes.shards[categoryIndex]?.name === shard.name;
  }

  function finish() {
    dispatch('select', selectedRunes);
  }

  function reset() {
    step = 'primary-path';
    selectedRunes = {
      primaryPath: '',
      primaryRunes: [],
      secondaryPath: '',
      secondaryRunes: [],
      shards: []
    };
  }
</script>

<div class="rune-selector">
  <div class="header">
    <h3>🔮 Sélection des Runes</h3>
    <button type="button" on:click={reset} class="btn-reset">🔄 Réinitialiser</button>
  </div>

  {#if step === 'primary-path'}
    <div class="step-title">Choisissez votre voie principale</div>
    <div class="paths-grid">
      {#each Object.values(runePaths) as path}
        <button 
          type="button"
          class="path-card" 
          style="border-color: {path.color}"
          on:click={() => selectPrimaryPath(path.name)}
        >
          <div class="path-icon" style="color: {path.color}"><img src="{getRuneImagePath(path.icon)}" alt={path.name} /></div>
          <div class="path-name">{path.name}</div>
        </button>
      {/each}
    </div>
  {/if}

  {#if step === 'primary-runes' && selectedRunes.primaryPath}
    <div class="step-title">
      Sélectionnez vos runes principales - 
      <span style="color: {runePaths[selectedRunes.primaryPath].color}">
        {selectedRunes.primaryPath}
      </span>
    </div>
    <div class="runes-selection">
      <div class="rune-slot">
        <div class="slot-title">Pierre angulaire</div>
        <div class="runes-row">
          {#each runePaths[selectedRunes.primaryPath].keystones as rune}
            <button 
              type="button"
              class="rune-card {isRuneSelected(rune) ? 'selected' : ''}"
              on:click={() => selectPrimaryRune(0, rune)}
            >
              <div class="rune-icon">
                <img src="{getRuneImagePath(rune.icon)}" alt={rune.name} />
              </div>
              <div class="rune-name">{rune.name}</div>
            </button>
          {/each}
        </div>
      </div>

      <div class="rune-slot">
        <div class="slot-title">Slot 1</div>
        <div class="runes-row">
          {#each runePaths[selectedRunes.primaryPath].slot1 as rune}
            <button 
              type="button"
              class="rune-card {isRuneSelected(rune) ? 'selected' : ''}"
              on:click={() => selectPrimaryRune(1, rune)}
            >
              <div class="rune-icon">
                <img src="{getRuneImagePath(rune.icon)}" alt={rune.name} />
              </div>
              <div class="rune-name">{rune.name}</div>
            </button>
          {/each}
        </div>
      </div>

      <div class="rune-slot">
        <div class="slot-title">Slot 2</div>
        <div class="runes-row">
          {#each runePaths[selectedRunes.primaryPath].slot2 as rune}
            <button 
              type="button"
              class="rune-card {isRuneSelected(rune) ? 'selected' : ''}"
              on:click={() => selectPrimaryRune(2, rune)}
            >
              <div class="rune-icon">
                <img src="{getRuneImagePath(rune.icon)}" alt={rune.name} />
              </div>
              <div class="rune-name">{rune.name}</div>
            </button>
          {/each}
        </div>
      </div>

      <div class="rune-slot">
        <div class="slot-title">Slot 3</div>
        <div class="runes-row">
          {#each runePaths[selectedRunes.primaryPath].slot3 as rune}
            <button 
              type="button"
              class="rune-card {isRuneSelected(rune) ? 'selected' : ''}"
              on:click={() => selectPrimaryRune(3, rune)}
            >
              <div class="rune-icon">
                <img src="{getRuneImagePath(rune.icon)}" alt={rune.name} />
              </div>
              <div class="rune-name">{rune.name}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="validation-actions">
      <button 
        type="button"
        on:click={validatePrimary} 
        class="btn-validate" 
        disabled={!canValidatePrimary}
      >
        Valider et continuer →
      </button>
    </div>
  {/if}

  {#if step === 'secondary-path'}
    <div class="step-title">Choisissez votre voie secondaire</div>
    <div class="paths-grid">
      {#each Object.values(runePaths) as path}
        <button 
          type="button"
          class="path-card {path.name === selectedRunes.primaryPath ? 'disabled' : ''}" 
          style="border-color: {path.color}"
          on:click={() => selectSecondaryPath(path.name)}
          disabled={path.name === selectedRunes.primaryPath}
        >
          <div class="path-icon" style="color: {path.color}"><img src="{getRuneImagePath(path.icon)}" alt={path.name} /></div>
          <div class="path-name">{path.name}</div>
        </button>
      {/each}
    </div>
  {/if}

  {#if step === 'secondary-runes' && selectedRunes.secondaryPath}
    <div class="step-title">
      Sélectionnez 2 runes secondaires - 
      <span style="color: {runePaths[selectedRunes.secondaryPath].color}">
        {selectedRunes.secondaryPath}
      </span>
    </div>
    <div class="runes-selection secondary">
      {#each ['slot1', 'slot2', 'slot3'] as slotKey, index}
        <div class="rune-slot">
          <div class="slot-title">Slot {index + 1}</div>
          <div class="runes-row">
            {#each runePaths[selectedRunes.secondaryPath][slotKey] as rune}
              <button 
                type="button"
                class="rune-card {isRuneSelected(rune) ? 'selected' : ''}"
                on:click={() => selectSecondaryRune(index, rune)}
              >
                <div class="rune-icon">
                  <img src="{getRuneImagePath(rune.icon)}" alt={rune.name} />
                </div>
                <div class="rune-name">{rune.name}</div>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="validation-actions">
      <button 
        type="button"
        on:click={validateSecondary} 
        class="btn-validate" 
        disabled={!canValidateSecondary}
      >
        Valider et continuer →
      </button>
    </div>
  {/if}

  {#if step === 'shards'}
    <div class="step-title">Sélectionnez vos fragments de statistiques</div>
    <div class="shards-selection">
      <div class="shard-row">
        <div class="shard-title">Offense</div>
        <div class="shards-grid">
          {#each statShards.offense as shard}
            <button 
              type="button"
              class="shard-card {selectedRunes.shards[0]?.name === shard.name ? 'selected' : ''}"
              on:click={() => selectShard('offense', shard)}
            >
              <div class="shard-icon"><img src="{getRuneImagePath(shard.icon)}" alt={shard.name} /></div>
              <div class="shard-stat">{shard.stat}</div>
            </button>
          {/each}
        </div>
      </div>

      <div class="shard-row">
        <div class="shard-title">Flex</div>
        <div class="shards-grid">
          {#each statShards.flex as shard}
            <button 
              type="button"
              class="shard-card {selectedRunes.shards[1]?.name === shard.name ? 'selected' : ''}"
              on:click={() => selectShard('flex', shard)}
            >
              <div class="shard-icon"><img src="{getRuneImagePath(shard.icon)}" alt={shard.name} /></div>
              <div class="shard-stat">{shard.stat}</div>
            </button>
          {/each}
        </div>
      </div>

      <div class="shard-row">
        <div class="shard-title">Défense</div>
        <div class="shards-grid">
          {#each statShards.defense as shard}
            <button 
              type="button"
              class="shard-card {selectedRunes.shards[2]?.name === shard.name ? 'selected' : ''}"
              on:click={() => selectShard('defense', shard)}
            >
              <div class="shard-icon"><img src="{getRuneImagePath(shard.icon)}" alt={shard.name} /></div>
              <div class="shard-stat">{shard.stat}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="finish-actions">
      <button 
        type="button"
        on:click={finish} 
        class="btn-finish"
        disabled={!canFinish}
      >
        ✅ Terminer
      </button>
    </div>
  {/if}
</div>

<style>
  .rune-selector {
    background: rgba(5, 10, 20, 0.95);
    border: 2px solid rgba(200, 170, 100, 0.3);
    border-radius: 12px;
    padding: 30px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 2px solid rgba(200, 170, 100, 0.2);
  }

  h3 {
    margin: 0;
    color: #c8aa6e;
    font-size: 24px;
  }

  .btn-reset {
    background: rgba(200, 100, 100, 0.2);
    border: 1px solid rgba(200, 100, 100, 0.4);
    color: #ff8888;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .btn-reset:hover {
    background: rgba(200, 100, 100, 0.3);
  }

  .step-title {
    color: #c8aa6e;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
    text-align: center;
  }

  .paths-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }

  .path-card {
    background: rgba(10, 20, 40, 0.8);
    border: 3px solid;
    border-radius: 10px;
    padding: 25px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
  }

  .path-card:not(.disabled):hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(200, 170, 100, 0.3);
  }

  .path-card.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .path-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }

  .path-name {
    color: #c8d3e0;
    font-size: 16px;
    font-weight: bold;
  }

  .runes-selection {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .rune-slot {
    background: rgba(10, 20, 40, 0.5);
    border-radius: 8px;
    padding: 15px;
  }

  .slot-title {
    color: #c8aa6e;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  .runes-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  .rune-card {
    background: rgba(20, 30, 50, 0.8);
    border: 2px solid rgba(200, 170, 100, 0.2);
    border-radius: 8px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .rune-card:hover {
    border-color: rgba(200, 170, 100, 0.5);
    transform: scale(1.05);
  }

  .rune-card.selected {
    border-color: #c8aa6e;
    background: rgba(200, 170, 100, 0.2);
    box-shadow: 0 0 15px rgba(200, 170, 100, 0.4);
  }

  .rune-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rune-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 5px rgba(200, 170, 100, 0.3));
  }

  .rune-card:hover .rune-icon img {
    filter: drop-shadow(0 0 10px rgba(200, 170, 100, 0.6));
  }

  .rune-card.selected .rune-icon img {
    filter: drop-shadow(0 0 15px rgba(200, 170, 100, 0.8)) brightness(1.2);
  }

  .rune-name {
    color: #c8d3e0;
    font-size: 12px;
    line-height: 1.3;
  }

  .shards-selection {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .shard-row {
    background: rgba(10, 20, 40, 0.5);
    border-radius: 8px;
    padding: 15px;
  }

  .shard-title {
    color: #c8aa6e;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  .shards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .shard-card {
    background: rgba(20, 30, 50, 0.8);
    border: 2px solid rgba(200, 170, 100, 0.2);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    pointer-events: auto;
  }

  .shard-card * {
    pointer-events: none;
  }

  .shard-card:hover {
    border-color: rgba(200, 170, 100, 0.5);
  }

  .shard-card.selected {
    border-color: #c8aa6e;
    background: rgba(200, 170, 100, 0.2);
  }

  .shard-icon {
    font-size: 24px;
    margin-bottom: 5px;
    pointer-events: none;
  }

  .shard-icon img {
    width: 24px;
    height: 24px;
    pointer-events: none;
  }

  .shard-stat {
    color: #c8d3e0;
    font-size: 11px;
    pointer-events: none;
  }

  .finish-actions {
    margin-top: 25px;
    text-align: center;
  }

  .validation-actions {
    margin-top: 25px;
    text-align: center;
    padding-top: 20px;
    border-top: 2px solid rgba(200, 170, 100, 0.2);
  }

  .btn-validate {
    background: linear-gradient(135deg, #4a9fd8 0%, #3a7fb8 100%);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }

  .btn-validate:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(74, 159, 216, 0.4);
  }

  .btn-validate:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-finish {
    background: linear-gradient(135deg, #c8aa6e 0%, #a88a50 100%);
    color: #0a1428;
    border: none;
    padding: 15px 40px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-finish:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(200, 170, 100, 0.4);
  }

  .btn-finish:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
