<script>
  import { createEventDispatcher } from 'svelte';
  import RuneSelector from './RuneSelector.svelte';
  import championData from '../data/champion.json';

  export let matchup = null;
  export let readOnly = false;

  const dispatch = createEventDispatcher();

  // Extraire la liste des champions avec leurs données
  const championsMap = championData.data;
  const championsList = Object.values(championsMap).sort((a, b) => a.name.localeCompare(b.name));
  const patchVersion = championData.version;

  function getChampionImageUrl(championId) {
    return `http://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${championId}.png`;
  }

  function getChampionDataByName(name) {
    return championsList.find(champ => champ.name === name);
  }

  $: myChampionData = getChampionDataByName(formData.myChampion);
  $: enemyChampionData = getChampionDataByName(formData.enemyChampion);

  let formData = {
    id: matchup?.id || '',
    myChampion: matchup?.myChampion || '',
    enemyChampion: matchup?.enemyChampion || '',
    lane: matchup?.lane || 'Top',
    runes: matchup?.runes || null,
    junglePaths: matchup?.junglePaths || [],
    topLaneData: matchup?.topLaneData || {
      powerSpikes: [], // [{level: 1}, {level: 3}, ...]
      keyItems: [], // [{item: 'Trinity Force', timing: '10min'}, ...]
      waveManagement: [], // [{level: 3, type: 'Freeze'}, ...]
      tpTimings: '', // Texte libre
      splitPushDamage: false, // Gros dégâts sur bâtiments
      teamFightUtility: false, // Utilité en teamfight
      earlyGame: false, // Early game (0-15min)
      midGame: false, // Mid game (15-25min)
      lateGame: false // Late game (25min+)
    },
    midLaneData: matchup?.midLaneData || {
      powerSpikes: [],
      keyItems: [],
      waveManagement: [],
      roamTimings: '', // Remplace TP Timings
      sidelaneOutplay: false, // Remplace splitPushDamage
      teamFightUtility: false,
      earlyGame: false,
      midGame: false,
      lateGame: false
    },
    notes: matchup?.notes || ''
  };

  let showRuneSelector = false;
  let myChampionSuggestions = [];
  let enemyChampionSuggestions = [];
  let showMyChampionDropdown = false;
  let showEnemyChampionDropdown = false;

  const lanes = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  const jungleCamps = ['Blue', 'Gromp', 'Wolves', 'Red', 'Krugs', 'Raptors', 'Scuttle'];
  const powerSpikeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const waveManagementTypes = [
    'Freeze', 
    'Slow Push', 
    'Fast Push', 
    'Reset',
    'Give Up Wave', // Abandonner la wave (back timing, roam, etc.)
    'Let Push', // Laisser push vers soi
    'Contest', // Contester la wave (trade/fight pour la CS)
    'Thin', // Éclaircir la wave sans push
    'Bounce' // Faire rebondir la wave
  ];
  
  let currentPath = [];
  let currentPathNote = '';
  let newCamp = '';
  let newTime = '';
  let newSmite = false;
  
  // Top Lane variables
  let newPowerSpikeLevel = '';
  let newKeyItem = '';
  let newKeyItemTiming = '';
  let newWaveStartLevel = '';
  let newWaveEndLevel = '';
  let newWaveType = '';

  $: isJungle = formData.lane === 'Jungle';
  $: isTopLane = formData.lane === 'Top';
  $: isADC = formData.lane === 'ADC';
  $: smiteCount = currentPath.filter(camp => camp.smite).length;
  $: canAddSmite = smiteCount < 2;
  $: pathComplete = currentPath.length >= 6;

  function filterChampions(input) {
    if (!input || input.length < 1) return [];
    const lowerInput = input.toLowerCase();
    return championsList.filter(champ => 
      champ && champ.name && champ.name.toLowerCase().includes(lowerInput)
    ).slice(0, 10); // Limite à 10 suggestions
  }

  function handleMyChampionInput(e) {
    formData.myChampion = e.target.value;
    myChampionSuggestions = filterChampions(formData.myChampion);
    showMyChampionDropdown = myChampionSuggestions.length > 0;
  }

  function handleEnemyChampionInput(e) {
    formData.enemyChampion = e.target.value;
    enemyChampionSuggestions = filterChampions(formData.enemyChampion);
    showEnemyChampionDropdown = enemyChampionSuggestions.length > 0;
  }

  function selectMyChampion(champion) {
    formData.myChampion = champion.name;
    showMyChampionDropdown = false;
  }

  function selectEnemyChampion(champion) {
    formData.enemyChampion = champion.name;
    showEnemyChampionDropdown = false;
  }

  function handleRuneSelect(event) {
    formData.runes = event.detail;
    formData = formData; // Force la réactivité de Svelte
    showRuneSelector = false;
  }

  function formatRunesDisplay(runes) {
    if (!runes || !runes.primaryPath) return 'Aucune rune sélectionnée';
    
    const primary = runes.primaryRunes.filter(r => r).map(r => r.name).join(', ');
    const secondary = runes.secondaryRunes.map(r => r.name).join(', ');
    
    return `${runes.primaryPath}: ${primary} | ${runes.secondaryPath}: ${secondary}`;
  }

  function addJungleCamp() {
    if (!newCamp || !newTime) {
      alert('Veuillez sélectionner un camp et entrer un timing');
      return;
    }
    
    if (pathComplete) {
      alert('Ce chemin de jungle est complet (6 camps). Veuillez créer un nouveau chemin.');
      return;
    }

    if (newSmite && !canAddSmite) {
      alert('Vous ne pouvez utiliser que 2 smites par chemin de jungle');
      return;
    }
    
    currentPath = [...currentPath, {
      camp: newCamp,
      time: newTime,
      smite: newSmite
    }];
    
    // Reset
    newCamp = '';
    newTime = '';
    newSmite = false;
  }

  function removeJungleCamp(index) {
    currentPath = currentPath.filter((_, i) => i !== index);
  }

  function saveCurrentPath() {
    if (currentPath.length === 0) {
      alert('Le chemin de jungle est vide');
      return;
    }

    formData.junglePaths = [...formData.junglePaths, {
      camps: [...currentPath],
      note: currentPathNote
    }];
    currentPath = [];
    currentPathNote = '';
  }

  function removeJunglePath(pathIndex) {
    formData.junglePaths = formData.junglePaths.filter((_, i) => i !== pathIndex);
  }

  // Top Lane functions
  function addPowerSpike() {
    if (!newPowerSpikeLevel) return;
    const level = parseInt(newPowerSpikeLevel);
    if (formData.topLaneData.powerSpikes.some(ps => ps.level === level)) {
      alert('Ce niveau est déjà ajouté');
      return;
    }
    formData.topLaneData.powerSpikes = [...formData.topLaneData.powerSpikes, { level }].sort((a, b) => a.level - b.level);
    newPowerSpikeLevel = '';
  }

  function removePowerSpike(index) {
    formData.topLaneData.powerSpikes = formData.topLaneData.powerSpikes.filter((_, i) => i !== index);
  }

  function addKeyItem() {
    if (!newKeyItem) return;
    formData.topLaneData.keyItems = [...formData.topLaneData.keyItems, { 
      item: newKeyItem, 
      timing: newKeyItemTiming 
    }];
    newKeyItem = '';
    newKeyItemTiming = '';
  }

  function removeKeyItem(index) {
    formData.topLaneData.keyItems = formData.topLaneData.keyItems.filter((_, i) => i !== index);
  }

  function addWaveManagement() {
    if (!newWaveStartLevel || !newWaveType) return;
    
    const startLevel = parseInt(newWaveStartLevel);
    const endLevel = newWaveEndLevel ? parseInt(newWaveEndLevel) : startLevel;
    
    // Validation
    if (endLevel < startLevel) {
      alert('Le niveau de fin doit être supérieur ou égal au niveau de début');
      return;
    }
    
    // Ajouter la plage de niveaux
    const levelRange = endLevel > startLevel ? `${startLevel}-${endLevel}` : `${startLevel}`;
    formData.topLaneData.waveManagement = [...formData.topLaneData.waveManagement, { 
      levelRange: levelRange,
      startLevel: startLevel,
      endLevel: endLevel,
      type: newWaveType 
    }].sort((a, b) => a.startLevel - b.startLevel);
    
    newWaveStartLevel = '';
    newWaveEndLevel = '';
    newWaveType = '';
  }

  function removeWaveManagement(index) {
    formData.topLaneData.waveManagement = formData.topLaneData.waveManagement.filter((_, i) => i !== index);
  }

  function handleSubmit() {
    if (!formData.myChampion || !formData.enemyChampion) {
      alert('Veuillez remplir au moins les champions');
      return;
    }
    
    // Sauvegarder le path actuel s'il existe
    if (currentPath.length > 0) {
      formData.junglePaths = [...formData.junglePaths, {
        camps: [...currentPath],
        note: currentPathNote
      }];
      currentPath = [];
      currentPathNote = '';
    }
    
    dispatch('save', formData);
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="form-container">
  <h2>{readOnly ? 'Consultation du Matchup' : matchup ? 'Éditer le Matchup' : 'Nouveau Matchup'}</h2>
  
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-row">
      <div class="form-group autocomplete-wrapper">
        <label for="myChampion">Mon Champion *</label>
        <div class="champion-input-wrapper">
          {#if myChampionData}
            <img src={getChampionImageUrl(myChampionData.id)} alt={myChampionData.name} class="champion-preview" />
          {/if}
          <input
            type="text"
            id="myChampion"
            value={formData.myChampion}
            on:input={handleMyChampionInput}
            on:focus={() => {
              if (formData.myChampion && !readOnly) {
                myChampionSuggestions = filterChampions(formData.myChampion);
                showMyChampionDropdown = myChampionSuggestions.length > 0;
              }
            }}
            on:blur={() => setTimeout(() => showMyChampionDropdown = false, 200)}
            placeholder="Ex: Darius"
            disabled={readOnly}
            autocomplete="off"
            required
          />
        </div>
        {#if showMyChampionDropdown && !readOnly}
          <div class="autocomplete-dropdown">
            {#each myChampionSuggestions as champion}
              <div 
                class="autocomplete-item"
                on:click={() => selectMyChampion(champion)}
              >
                <img src={getChampionImageUrl(champion.id)} alt={champion.name} class="champion-icon" />
                <span>{champion.name}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="form-group autocomplete-wrapper">
        <label for="enemyChampion">Champion Adversaire *</label>
        <div class="champion-input-wrapper">
          {#if enemyChampionData}
            <img src={getChampionImageUrl(enemyChampionData.id)} alt={enemyChampionData.name} class="champion-preview" />
          {/if}
          <input
            type="text"
            id="enemyChampion"
            value={formData.enemyChampion}
            on:input={handleEnemyChampionInput}
            on:focus={() => {
              if (formData.enemyChampion && !readOnly) {
                enemyChampionSuggestions = filterChampions(formData.enemyChampion);
                showEnemyChampionDropdown = enemyChampionSuggestions.length > 0;
              }
            }}
            on:blur={() => setTimeout(() => showEnemyChampionDropdown = false, 200)}
            placeholder="Ex: Garen"
            disabled={readOnly}
            autocomplete="off"
            required
          />
        </div>
        {#if showEnemyChampionDropdown && !readOnly}
          <div class="autocomplete-dropdown">
            {#each enemyChampionSuggestions as champion}
              <div 
                class="autocomplete-item"
                on:click={() => selectEnemyChampion(champion)}
              >
                <img src={getChampionImageUrl(champion.id)} alt={champion.name} class="champion-icon" />
                <span>{champion.name}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="form-group">
      <label for="lane">Lane</label>
      <select id="lane" bind:value={formData.lane} disabled={readOnly}>
        {#each lanes as lane}
          <option value={lane}>{lane}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label>Runes utilisées</label>
      {#if !showRuneSelector}
        <div class="runes-display">
          <div class="runes-text">
            {formData.runes ? formatRunesDisplay(formData.runes) : 'Aucune rune sélectionnée'}
          </div>
          {#if !readOnly}
            <button type="button" on:click={() => showRuneSelector = true} class="btn-select-runes">
              🔮 {formData.runes ? 'Modifier les runes' : 'Sélectionner les runes'}
            </button>
          {/if}
        </div>
      {:else}
        <RuneSelector 
          selectedRunes={formData.runes || { primaryPath: '', primaryRunes: [], secondaryPath: '', secondaryRunes: [], shards: [] }}
          on:select={handleRuneSelect}
        />
        <button type="button" on:click={() => showRuneSelector = false} class="btn-cancel-runes">
          ❌ Annuler la sélection
        </button>
      {/if}
    </div>

    {#if isJungle}
      <div class="form-group jungle-path-section">
        <label>🌲 Chemins de Jungle (Jungle Paths)</label>
        
        <!-- Affichage des paths sauvegardés -->
        {#if formData.junglePaths.length > 0}
          <div class="saved-paths">
            {#each formData.junglePaths as pathData, pathIndex}
              <div class="saved-path">
                <div class="path-header">
                  <strong>Path {pathIndex + 1}</strong>
                  {#if !readOnly}
                    <button type="button" class="btn-remove-path" on:click={() => removeJunglePath(pathIndex)}>
                      🗑️ Supprimer ce path
                    </button>
                  {/if}
                </div>
                <div class="jungle-path-display">
                  {#each (pathData.camps || pathData) as camp, index}
                    <div class="camp-item">
                      <div class="camp-info">
                        <strong>{camp.camp}</strong>
                        <span class="camp-time">{camp.time}</span>
                        {#if camp.smite}
                          <span class="camp-smite">⚡ SMITE</span>
                        {/if}
                      </div>
                    </div>
                    {#if index < (pathData.camps || pathData).length - 1}
                      <div class="camp-arrow">→</div>
                    {/if}
                  {/each}
                </div>
                {#if pathData.note}
                  <div class="path-note">
                    <span class="note-icon">📝</span>
                    <span>{pathData.note}</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        {#if !readOnly}
          <!-- Path en cours de création -->
          <div class="current-path-section">
            <h4>
              {currentPath.length > 0 ? `Nouveau Path (${currentPath.length}/6 camps, ${smiteCount}/2 smites)` : 'Créer un nouveau path'}
            </h4>
            
            {#if currentPath.length > 0}
              <div class="jungle-path-display">
                {#each currentPath as camp, index}
                  <div class="camp-item">
                    <div class="camp-info">
                      <strong>{camp.camp}</strong>
                      <span class="camp-time">{camp.time}</span>
                      {#if camp.smite}
                        <span class="camp-smite">⚡ SMITE</span>
                      {/if}
                    </div>
                    <button type="button" class="btn-remove-camp" on:click={() => removeJungleCamp(index)}>
                      ❌
                    </button>
                  </div>
                  {#if index < currentPath.length - 1}
                    <div class="camp-arrow">→</div>
                  {/if}
                {/each}
              </div>
            {/if}

            <div class="jungle-path-input">
              <select bind:value={newCamp} class="camp-select" disabled={pathComplete}>
                <option value="">Sélectionner un camp</option>
                {#each jungleCamps as camp}
                  <option value={camp}>{camp}</option>
                {/each}
              </select>
              
              <input 
                type="text" 
                bind:value={newTime} 
                placeholder="Ex: 1.45"
                class="time-input"
                disabled={pathComplete}
              />
              
              <label class="smite-checkbox">
                <input type="checkbox" bind:checked={newSmite} disabled={!canAddSmite || pathComplete} />
                <span>SMITE {canAddSmite ? `(${2 - smiteCount} restant${2 - smiteCount > 1 ? 's' : ''})` : '(Max atteint)'}</span>
              </label>
              
              <button type="button" class="btn-add-camp" on:click={addJungleCamp} disabled={pathComplete}>
                ➕ Ajouter
              </button>
            </div>

            {#if currentPath.length > 0}
              <div class="path-note-input">
                <label for="pathNote">📝 Note pour ce path (optionnel)</label>
                <input 
                  type="text" 
                  id="pathNote"
                  bind:value={currentPathNote} 
                  placeholder="Ex: Contre envahisseur, Clear rapide, Gank level 3..."
                  class="note-input"
                />
              </div>
              
              <button type="button" class="btn-save-path" on:click={saveCurrentPath}>
                💾 Sauvegarder ce path
              </button>
            {/if}

            {#if pathComplete}
              <p class="path-complete-message">
                ✅ Path complet (6 camps). Sauvegardez-le pour en créer un nouveau.
              </p>
            {/if}
          </div>
        {:else if formData.junglePaths.length === 0}
          <p class="no-jungle-path">Aucun chemin de jungle défini</p>
        {/if}
      </div>
    {/if}

    <!-- Top Lane Section -->
    {#if isTopLane && !readOnly}
      <div class="top-lane-section">
        <h3>⚔️ Stratégie Top Lane</h3>

        <!-- Power Spikes -->
        <div class="form-group">
          <label>⚡ Power Spikes (Niveaux clés)</label>
          <div class="power-spikes-grid">
            {#each powerSpikeOptions as level}
              <button 
                type="button" 
                class="level-button" 
                class:selected={formData.topLaneData.powerSpikes.some(ps => ps.level === level)}
                on:click={() => {
                  const exists = formData.topLaneData.powerSpikes.some(ps => ps.level === level);
                  if (exists) {
                    formData.topLaneData.powerSpikes = formData.topLaneData.powerSpikes.filter(ps => ps.level !== level);
                  } else {
                    formData.topLaneData.powerSpikes = [...formData.topLaneData.powerSpikes, { level }].sort((a, b) => a.level - b.level);
                  }
                }}
              >
                {level}
              </button>
            {/each}
          </div>
          {#if formData.topLaneData.powerSpikes.length > 0}
            <div class="selected-levels">
              <strong>Sélectionnés:</strong>
              {formData.topLaneData.powerSpikes.map(ps => `Niv. ${ps.level}`).join(', ')}
            </div>
          {/if}
        </div>

        <!-- Key Items -->
        <div class="form-group">
          <label>🛡️ Objets Clés & Timings</label>
          <div class="key-items-input">
            <input 
              type="text" 
              bind:value={newKeyItem} 
              placeholder="Ex: Trinity Force, BORK..."
              class="item-input"
            />
            <input 
              type="text" 
              bind:value={newKeyItemTiming} 
              placeholder="Timing (ex: 10min)"
              class="timing-input"
            />
            <button type="button" class="btn-add-small" on:click={addKeyItem}>
              ➕
            </button>
          </div>
          {#if formData.topLaneData.keyItems.length > 0}
            <div class="key-items-list">
              {#each formData.topLaneData.keyItems as item, index}
                <div class="item-badge">
                  <strong>{item.item}</strong>
                  {#if item.timing}
                    <span class="item-timing">@{item.timing}</span>
                  {/if}
                  <button type="button" class="btn-remove-tiny" on:click={() => removeKeyItem(index)}>×</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Wave Management -->
        <div class="form-group">
          <label>🌊 Wave Management par Niveau</label>
          <div class="wave-management-input">
            <div class="level-range-inputs">
              <select bind:value={newWaveStartLevel} class="level-select-small">
                <option value="">De niv...</option>
                {#each powerSpikeOptions as level}
                  <option value={level}>{level}</option>
                {/each}
              </select>
              <span class="range-separator">à</span>
              <select bind:value={newWaveEndLevel} class="level-select-small">
                <option value="">À niv... (optionnel)</option>
                {#each powerSpikeOptions as level}
                  <option value={level}>{level}</option>
                {/each}
              </select>
            </div>
            <select bind:value={newWaveType} class="wave-type-select">
              <option value="">Type...</option>
              {#each waveManagementTypes as type}
                <option value={type}>{type}</option>
              {/each}
            </select>
            <button type="button" class="btn-add-small" on:click={addWaveManagement}>
              ➕
            </button>
          </div>
          {#if formData.topLaneData.waveManagement.length > 0}
            <div class="wave-management-list">
              {#each formData.topLaneData.waveManagement as wave, index}
                <div class="wave-badge">
                  <strong>Niv. {wave.levelRange || wave.level}:</strong> {wave.type}
                  <button type="button" class="btn-remove-tiny" on:click={() => removeWaveManagement(index)}>×</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- TP Timings -->
        <div class="form-group">
          <label for="tpTimings">📍 TP Timings & Roams</label>
          <textarea
            id="tpTimings"
            bind:value={formData.topLaneData.tpTimings}
            placeholder="Ex: TP bot à 8min pour drake, TP mid si je push..."
            rows="3"
          ></textarea>
        </div>

        <!-- Split Push vs Team Fight -->
        <div class="form-group">
          <label>🎯 Style de Jeu</label>
          <div class="playstyle-toggles">
            <label class="toggle-option">
              <input type="checkbox" bind:checked={formData.topLaneData.splitPushDamage} />
              <span class="toggle-label">
                <span class="toggle-icon">🏰</span>
                <span>Gros dégâts sur bâtiments (Split Push)</span>
              </span>
            </label>
            <label class="toggle-option">
              <input type="checkbox" bind:checked={formData.topLaneData.teamFightUtility} />
              <span class="toggle-label">
                <span class="toggle-icon">⚔️</span>
                <span>Utilité en Team Fight</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Game Phases -->
        <div class="form-group">
          <label>💪 Points Forts</label>
          <div class="game-phases">
            <label class="phase-option">
              <input type="checkbox" bind:checked={formData.topLaneData.earlyGame} />
              <span class="phase-label">
                <span class="phase-icon">🌅</span>
                <span class="phase-text">
                  <strong>EARLY</strong>
                  <small>0-15 min</small>
                </span>
              </span>
            </label>
            <label class="phase-option">
              <input type="checkbox" bind:checked={formData.topLaneData.midGame} />
              <span class="phase-label">
                <span class="phase-icon">☀️</span>
                <span class="phase-text">
                  <strong>MID</strong>
                  <small>15-25 min</small>
                </span>
              </span>
            </label>
            <label class="phase-option">
              <input type="checkbox" bind:checked={formData.topLaneData.lateGame} />
              <span class="phase-label">
                <span class="phase-icon">🌙</span>
                <span class="phase-text">
                  <strong>LATE</strong>
                  <small>25+ min</small>
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    {/if}

    <!-- Mid Lane Section -->
    {#if formData.lane === 'Mid' && !readOnly}
      <div class="mid-lane-section">
        <h3>⚡ Stratégie Mid Lane</h3>

        <!-- Power Spikes -->
        <div class="form-group">
          <label>⚡ Power Spikes (Niveaux clés)</label>
          <div class="power-spikes-grid">
            {#each powerSpikeOptions as level}
              <button 
                type="button" 
                class="level-button" 
                class:selected={formData.midLaneData.powerSpikes.some(ps => ps.level === level)}
                on:click={() => {
                  const exists = formData.midLaneData.powerSpikes.some(ps => ps.level === level);
                  if (exists) {
                    formData.midLaneData.powerSpikes = formData.midLaneData.powerSpikes.filter(ps => ps.level !== level);
                  } else {
                    formData.midLaneData.powerSpikes = [...formData.midLaneData.powerSpikes, { level }].sort((a, b) => a.level - b.level);
                  }
                }}
              >
                {level}
              </button>
            {/each}
          </div>
          {#if formData.midLaneData.powerSpikes.length > 0}
            <div class="selected-levels">
              <strong>Sélectionnés:</strong>
              {formData.midLaneData.powerSpikes.map(ps => `Niv. ${ps.level}`).join(', ')}
            </div>
          {/if}
        </div>

        <!-- Key Items -->
        <div class="form-group">
          <label>🛡️ Objets Clés & Timings</label>
          <div class="key-items-input">
            <input 
              type="text" 
              bind:value={newKeyItem} 
              placeholder="Ex: Luden, Shadowflame..."
              class="item-input"
            />
            <input 
              type="text" 
              bind:value={newKeyItemTiming} 
              placeholder="Timing (ex: 10min)"
              class="timing-input"
            />
            <button type="button" class="btn-add-small" on:click={() => {
              if (!newKeyItem) return;
              formData.midLaneData.keyItems = [...formData.midLaneData.keyItems, { 
                item: newKeyItem, 
                timing: newKeyItemTiming 
              }];
              newKeyItem = '';
              newKeyItemTiming = '';
            }}>
              ➕
            </button>
          </div>
          {#if formData.midLaneData.keyItems.length > 0}
            <div class="key-items-list">
              {#each formData.midLaneData.keyItems as item, index}
                <div class="item-badge">
                  <strong>{item.item}</strong>
                  {#if item.timing}
                    <span class="item-timing">@{item.timing}</span>
                  {/if}
                  <button type="button" class="btn-remove-tiny" on:click={() => {
                    formData.midLaneData.keyItems = formData.midLaneData.keyItems.filter((_, i) => i !== index);
                  }}>×</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Wave Management -->
        <div class="form-group">
          <label>🌊 Wave Management par Niveau</label>
          <div class="wave-management-input">
            <div class="level-range-inputs">
              <select bind:value={newWaveStartLevel} class="level-select-small">
                <option value="">De niv...</option>
                {#each powerSpikeOptions as level}
                  <option value={level}>{level}</option>
                {/each}
              </select>
              <span class="range-separator">à</span>
              <select bind:value={newWaveEndLevel} class="level-select-small">
                <option value="">À niv... (optionnel)</option>
                {#each powerSpikeOptions as level}
                  <option value={level}>{level}</option>
                {/each}
              </select>
            </div>
            <select bind:value={newWaveType} class="wave-type-select">
              <option value="">Type...</option>
              {#each waveManagementTypes as type}
                <option value={type}>{type}</option>
              {/each}
            </select>
            <button type="button" class="btn-add-small" on:click={() => {
              if (!newWaveStartLevel || !newWaveType) return;
              const startLevel = parseInt(newWaveStartLevel);
              const endLevel = newWaveEndLevel ? parseInt(newWaveEndLevel) : startLevel;
              if (endLevel < startLevel) {
                alert('Le niveau de fin doit être supérieur ou égal au niveau de début');
                return;
              }
              const levelRange = endLevel > startLevel ? `${startLevel}-${endLevel}` : `${startLevel}`;
              formData.midLaneData.waveManagement = [...formData.midLaneData.waveManagement, { 
                levelRange: levelRange,
                startLevel: startLevel,
                endLevel: endLevel,
                type: newWaveType 
              }].sort((a, b) => a.startLevel - b.startLevel);
              newWaveStartLevel = '';
              newWaveEndLevel = '';
              newWaveType = '';
            }}>
              ➕
            </button>
          </div>
          {#if formData.midLaneData.waveManagement.length > 0}
            <div class="wave-management-list">
              {#each formData.midLaneData.waveManagement as wave, index}
                <div class="wave-badge">
                  <strong>Niv. {wave.levelRange || wave.level}:</strong> {wave.type}
                  <button type="button" class="btn-remove-tiny" on:click={() => {
                    formData.midLaneData.waveManagement = formData.midLaneData.waveManagement.filter((_, i) => i !== index);
                  }}>×</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Roam Timings -->
        <div class="form-group">
          <label for="roamTimings">📍 Roam Timings & Priority</label>
          <textarea
            id="roamTimings"
            bind:value={formData.midLaneData.roamTimings}
            placeholder="Ex: Roam bot après push wave niveau 6, priority drake..."
            rows="3"
          ></textarea>
        </div>

        <!-- Sidelane vs Team Fight -->
        <div class="form-group">
          <label>🎯 Style de Jeu</label>
          <div class="playstyle-toggles">
            <label class="toggle-option">
              <input type="checkbox" bind:checked={formData.midLaneData.sidelaneOutplay} />
              <span class="toggle-label">
                <span class="toggle-icon">🥊</span>
                <span>Duel en Sidelane (Outplay 1v1)</span>
              </span>
            </label>
            <label class="toggle-option">
              <input type="checkbox" bind:checked={formData.midLaneData.teamFightUtility} />
              <span class="toggle-label">
                <span class="toggle-icon">⚔️</span>
                <span>Utilité en Team Fight</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Game Phases -->
        <div class="form-group">
          <label>💪 Points Forts</label>
          <div class="game-phases">
            <label class="phase-option">
              <input type="checkbox" bind:checked={formData.midLaneData.earlyGame} />
              <span class="phase-label">
                <span class="phase-icon">🌅</span>
                <span class="phase-text">
                  <strong>EARLY</strong>
                  <small>0-15 min</small>
                </span>
              </span>
            </label>
            <label class="phase-option">
              <input type="checkbox" bind:checked={formData.midLaneData.midGame} />
              <span class="phase-label">
                <span class="phase-icon">☀️</span>
                <span class="phase-text">
                  <strong>MID</strong>
                  <small>15-25 min</small>
                </span>
              </span>
            </label>
            <label class="phase-option">
              <input type="checkbox" bind:checked={formData.midLaneData.lateGame} />
              <span class="phase-label">
                <span class="phase-icon">🌙</span>
                <span class="phase-text">
                  <strong>LATE</strong>
                  <small>25+ min</small>
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    {/if}

    <!-- ADC Section - NEW FEATURE v1.0.1 -->
    {#if isADC && !readOnly}
      <div class="adc-section">
        <h3>🎯 Informations ADC</h3>
        <div class="adc-info-box">
          <p>✨ <strong>Nouvelle fonctionnalité!</strong></p>
          <p>Section spéciale pour les ADC en cours de développement.</p>
          <p>🔜 Bientôt disponible: Synergies Support, Power Spikes ADC, Gestion de lane bot</p>
        </div>
      </div>
    {/if}

    <div class="form-group">
      <label for="notes">Notes et Actions</label>
      <textarea
        id="notes"
        bind:value={formData.notes}
        placeholder="Stratégies, points forts/faibles, moments clés du matchup..."
        rows="6"
        disabled={readOnly}
      ></textarea>
    </div>

    <div class="form-actions">
      <button type="button" on:click={handleCancel} class="btn-secondary">
        {readOnly ? 'Retour' : 'Annuler'}
      </button>
      {#if !readOnly}
        <button type="submit" class="btn-primary">
          {matchup ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      {/if}
    </div>
  </form>
</div>

<style>
  .form-container {
    max-width: 800px;
    margin: 0 auto;
  }

  h2 {
    color: #c8aa6e;
    margin-bottom: 30px;
    font-size: 24px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .autocomplete-wrapper {
    position: relative;
  }

  .autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(10, 20, 40, 0.95);
    border: 1px solid rgba(200, 170, 100, 0.5);
    border-radius: 6px;
    margin-top: 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .autocomplete-item {
    padding: 12px;
    color: #c8d3e0;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(200, 170, 100, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .autocomplete-item:last-child {
    border-bottom: none;
  }

  .autocomplete-item:hover {
    background: rgba(200, 170, 100, 0.2);
    color: #c8aa6e;
  }

  .champion-icon {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 2px solid rgba(200, 170, 100, 0.3);
  }

  .champion-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
  }

  .champion-preview {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    border: 2px solid rgba(200, 170, 100, 0.5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .champion-input-wrapper input {
    flex: 1;
  }

  .autocomplete-dropdown::-webkit-scrollbar {
    width: 8px;
  }

  .autocomplete-dropdown::-webkit-scrollbar-track {
    background: rgba(10, 20, 40, 0.5);
    border-radius: 4px;
  }

  .autocomplete-dropdown::-webkit-scrollbar-thumb {
    background: rgba(200, 170, 100, 0.3);
    border-radius: 4px;
  }

  .autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
    background: rgba(200, 170, 100, 0.5);
  }

  label {
    color: #c8aa6e;
    font-weight: 600;
    font-size: 14px;
  }

  input,
  select,
  textarea {
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    padding: 12px;
    color: #c8d3e0;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #c8aa6e;
    box-shadow: 0 0 0 3px rgba(200, 170, 110, 0.1);
  }

  textarea {
    resize: vertical;
  }

  small {
    color: #7a8a9e;
    font-size: 12px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(200, 170, 100, 0.1);
  }

  .btn-primary,
  .btn-secondary {
    padding: 12px 32px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #c8aa6e 0%, #a88a50 100%);
    color: #0a1428;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(200, 170, 110, 0.4);
  }

  .btn-secondary {
    background: rgba(200, 170, 100, 0.1);
    color: #c8d3e0;
    border: 1px solid rgba(200, 170, 100, 0.3);
  }

  .btn-secondary:hover {
    background: rgba(200, 170, 100, 0.2);
    border-color: rgba(200, 170, 100, 0.5);
  }

  .runes-display {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .runes-text {
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    padding: 12px;
    color: #c8d3e0;
    font-size: 14px;
    min-height: 50px;
    display: flex;
    align-items: center;
  }

  .btn-select-runes {
    background: linear-gradient(135deg, #4a9fd8 0%, #3a7fb8 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-select-runes:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(74, 159, 216, 0.4);
  }

  .btn-cancel-runes {
    background: rgba(200, 100, 100, 0.2);
    border: 1px solid rgba(200, 100, 100, 0.4);
    color: #ff8888;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 10px;
    font-size: 14px;
    transition: all 0.2s;
  }

  .btn-cancel-runes:hover {
    background: rgba(200, 100, 100, 0.3);
  }

  /* Jungle Path Styles */
  .jungle-path-section {
    background: rgba(10, 20, 40, 0.4);
    border: 2px solid rgba(74, 159, 216, 0.3);
    border-radius: 8px;
    padding: 20px;
  }

  .saved-paths {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
  }

  .saved-path {
    background: rgba(74, 159, 216, 0.05);
    border: 1px solid rgba(74, 159, 216, 0.2);
    border-radius: 6px;
    padding: 12px;
  }

  .path-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(74, 159, 216, 0.2);
  }

  .path-header strong {
    color: #4a9fd8;
    font-size: 14px;
  }

  .btn-remove-path {
    background: rgba(200, 100, 100, 0.2);
    border: 1px solid rgba(200, 100, 100, 0.4);
    color: #ff8888;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .btn-remove-path:hover {
    background: rgba(200, 100, 100, 0.4);
  }

  .path-note {
    margin-top: 10px;
    padding: 8px 12px;
    background: rgba(200, 170, 100, 0.05);
    border-left: 3px solid rgba(200, 170, 100, 0.4);
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #c8d3e0;
  }

  .note-icon {
    font-size: 14px;
  }

  .path-note-input {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .path-note-input label {
    color: #c8aa6e;
    font-size: 13px;
    font-weight: 600;
  }

  .note-input {
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    padding: 10px;
    color: #c8d3e0;
    font-size: 14px;
    width: 100%;
  }

  .note-input:focus {
    outline: none;
    border-color: #c8aa6e;
    box-shadow: 0 0 0 2px rgba(200, 170, 100, 0.1);
  }

  .current-path-section {
    background: rgba(74, 159, 216, 0.03);
    border: 1px dashed rgba(74, 159, 216, 0.3);
    border-radius: 6px;
    padding: 16px;
    margin-top: 16px;
  }

  .current-path-section h4 {
    color: #4a9fd8;
    font-size: 14px;
    margin: 0 0 12px 0;
  }

  .path-complete-message {
    color: #5ac85a;
    font-weight: bold;
    margin-top: 12px;
    padding: 10px;
    background: rgba(90, 200, 90, 0.1);
    border: 1px solid rgba(90, 200, 90, 0.3);
    border-radius: 4px;
    text-align: center;
  }

  .jungle-path-display {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin: 16px 0;
  }

  .camp-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(74, 159, 216, 0.1);
    border: 1px solid rgba(74, 159, 216, 0.3);
    border-radius: 6px;
    padding: 8px 12px;
  }

  .camp-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .camp-info strong {
    color: #4a9fd8;
    font-size: 14px;
  }

  .camp-time {
    color: #c8aa6e;
    font-size: 13px;
    font-weight: bold;
  }

  .camp-smite {
    color: #ffd700;
    font-size: 11px;
    font-weight: bold;
  }

  .camp-arrow {
    color: #4a9fd8;
    font-size: 20px;
    font-weight: bold;
  }

  .btn-remove-camp {
    background: rgba(200, 100, 100, 0.2);
    border: 1px solid rgba(200, 100, 100, 0.4);
    color: #ff8888;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .btn-remove-camp:hover {
    background: rgba(200, 100, 100, 0.4);
  }

  .no-jungle-path {
    color: #7a8a9e;
    font-style: italic;
    margin: 12px 0;
  }

  .jungle-path-input {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .camp-select {
    flex: 1;
    min-width: 150px;
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    padding: 10px;
    color: #c8d3e0;
    font-size: 14px;
  }

  .time-input {
    width: 100px;
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    padding: 10px;
    color: #c8d3e0;
    font-size: 14px;
  }

  .smite-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #c8d3e0;
    cursor: pointer;
  }

  .smite-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .smite-checkbox span {
    font-size: 14px;
    font-weight: bold;
    color: #ffd700;
  }

  .btn-add-camp {
    background: linear-gradient(135deg, #4a9fd8 0%, #3a7fb8 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
  }

  .btn-add-camp:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(74, 159, 216, 0.4);
  }

  .btn-add-camp:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-save-path {
    background: linear-gradient(135deg, #5ac85a 0%, #4ab84a 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
  }

  .btn-save-path:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(90, 200, 90, 0.4);
  }

  .smite-checkbox input[type="checkbox"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .camp-select:disabled,
  .time-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  /* Top Lane Styles */
  .top-lane-section {
    background: rgba(200, 100, 100, 0.05);
    border: 1px solid rgba(200, 100, 100, 0.2);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .top-lane-section h3 {
    color: #c86464;
    font-size: 18px;
    margin: 0 0 20px 0;
  }

  .power-spikes-input,
  .key-items-input,
  .wave-management-input {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .level-range-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .range-separator {
    color: #7a8a9e;
    font-size: 14px;
    font-weight: bold;
  }

  .power-spikes-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 8px;
    margin-top: 8px;
  }

  .level-button {
    padding: 10px;
    background: rgba(10, 20, 40, 0.8);
    border: 2px solid rgba(200, 100, 100, 0.3);
    border-radius: 6px;
    color: #c8d3e0;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .level-button:hover {
    background: rgba(200, 100, 100, 0.15);
    border-color: rgba(200, 100, 100, 0.5);
    transform: translateY(-2px);
  }

  .level-button.selected {
    background: linear-gradient(135deg, rgba(200, 100, 100, 0.4) 0%, rgba(200, 100, 100, 0.6) 100%);
    border-color: #c86464;
    color: #fff;
    box-shadow: 0 0 12px rgba(200, 100, 100, 0.5);
  }

  .level-button.selected:hover {
    background: linear-gradient(135deg, rgba(200, 100, 100, 0.5) 0%, rgba(200, 100, 100, 0.7) 100%);
  }

  .selected-levels {
    margin-top: 12px;
    padding: 10px;
    background: rgba(200, 100, 100, 0.1);
    border: 1px solid rgba(200, 100, 100, 0.3);
    border-radius: 6px;
    color: #c8d3e0;
    font-size: 13px;
  }

  .selected-levels strong {
    color: #c86464;
    margin-right: 8px;
  }

  .level-select,
  .level-select-small {
    padding: 8px 12px;
    background: rgba(10, 20, 40, 0.8);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    color: #c8d3e0;
    font-size: 14px;
  }

  .level-select-small {
    flex: 0 0 100px;
  }

  .wave-type-select {
    flex: 1;
    padding: 8px 12px;
    background: rgba(10, 20, 40, 0.8);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    color: #c8d3e0;
    font-size: 14px;
  }

  .item-input {
    flex: 2;
    padding: 8px 12px;
    background: rgba(10, 20, 40, 0.8);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    color: #c8d3e0;
  }

  .timing-input {
    flex: 1;
    padding: 8px 12px;
    background: rgba(10, 20, 40, 0.8);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    color: #c8d3e0;
  }

  .btn-add-small {
    padding: 8px 16px;
    background: rgba(200, 170, 100, 0.2);
    border: 1px solid rgba(200, 170, 100, 0.5);
    border-radius: 6px;
    color: #c8aa6e;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }

  .btn-add-small:hover {
    background: rgba(200, 170, 100, 0.3);
    border-color: #c8aa6e;
  }

  .power-spikes-list,
  .key-items-list,
  .wave-management-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .spike-badge,
  .wave-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(200, 100, 100, 0.15);
    border: 1px solid rgba(200, 100, 100, 0.4);
    padding: 6px 12px;
    border-radius: 6px;
    color: #c8d3e0;
    font-size: 13px;
  }

  .item-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(200, 170, 100, 0.15);
    border: 1px solid rgba(200, 170, 100, 0.4);
    padding: 6px 12px;
    border-radius: 6px;
    color: #c8d3e0;
    font-size: 13px;
  }

  .item-badge strong {
    color: #c8aa6e;
  }

  .item-timing {
    color: #7a8a9e;
    font-size: 11px;
  }

  .btn-remove-tiny {
    background: none;
    border: none;
    color: #c86464;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    transition: all 0.2s;
  }

  .btn-remove-tiny:hover {
    color: #ff6464;
    transform: scale(1.2);
  }

  .playstyle-toggles {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .toggle-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.2);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-option:hover {
    background: rgba(10, 20, 40, 0.8);
    border-color: rgba(200, 170, 100, 0.4);
  }

  .toggle-option input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #c8d3e0;
    font-size: 14px;
  }

  .toggle-icon {
    font-size: 20px;
  }

  .game-phases {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .phase-option {
    flex: 1;
    min-width: 150px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .phase-option:hover {
    background: rgba(10, 20, 40, 0.8);
    border-color: rgba(200, 170, 100, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .phase-option input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .phase-option input[type="checkbox"]:checked {
    accent-color: #c8aa6e;
  }

  .phase-label {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .phase-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .phase-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .phase-text strong {
    color: #c8aa6e;
    font-size: 14px;
    font-weight: 600;
  }

  .phase-text small {
    color: #7a8a9e;
    font-size: 11px;
  }

  .mid-lane-section {
    margin-top: 20px;
    padding: 20px;
    background: rgba(100, 100, 200, 0.05);
    border: 1px solid rgba(100, 150, 200, 0.3);
    border-radius: 8px;
  }

  .mid-lane-section h3 {
    color: #6495ed;
    margin: 0 0 20px 0;
    font-size: 18px;
    border-bottom: 1px solid rgba(100, 150, 200, 0.3);
    padding-bottom: 10px;
  }

  /* ADC Section Styles */
  .adc-section {
    margin-top: 20px;
    padding: 20px;
    background: rgba(200, 150, 50, 0.05);
    border: 1px solid rgba(200, 150, 50, 0.3);
    border-radius: 8px;
  }

  .adc-section h3 {
    color: #c8aa6e;
    margin: 0 0 20px 0;
    font-size: 18px;
    border-bottom: 1px solid rgba(200, 150, 50, 0.3);
    padding-bottom: 10px;
  }

  .adc-info-box {
    background: rgba(200, 170, 100, 0.1);
    border-left: 4px solid #c8aa6e;
    padding: 16px;
    border-radius: 6px;
  }

  .adc-info-box p {
    margin: 8px 0;
    color: #c8d3e0;
    line-height: 1.6;
  }

  .adc-info-box strong {
    color: #c8aa6e;
  }
</style>

