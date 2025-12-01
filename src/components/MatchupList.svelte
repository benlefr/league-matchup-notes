<script>
  import { createEventDispatcher } from 'svelte';
  import { getRuneImagePath } from '../utils/paths.js';
  import championData from '../data/champion.json';

  export let matchups = [];

  const patchVersion = championData.version;
  const championsMap = championData.data;

  function getChampionImageUrl(championName) {
    const champion = Object.values(championsMap).find(champ => champ.name === championName);
    if (champion) {
      return `http://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${champion.id}.png`;
    }
    return '';
  }

  const dispatch = createEventDispatcher();

  let searchMyChampion = '';
  let searchEnemyChampion = '';
  let expandedJunglePaths = {}; // Pour gérer l'état ouvert/fermé des jungle paths
  let editingPathNotes = {}; // Pour gérer l'édition des notes de path
  let expandedCards = {}; // Pour gérer l'état ouvert/fermé des cartes
  let hoverTimeouts = {}; // Pour gérer les délais d'expansion
  let pinnedCards = {}; // Pour gérer les cartes verrouillées par clic
  let clickTimeouts = {}; // Pour gérer le délai entre clic et double-clic
  let expandedTopLaneData = {}; // Pour gérer l'état ouvert/fermé des données Top Lane
  let expandedMidLaneData = {}; // Pour gérer l'état ouvert/fermé des données Mid Lane

  $: filteredMatchups = matchups.filter(matchup => {
    const myChampMatch = matchup.myChampion.toLowerCase().includes(searchMyChampion.toLowerCase());
    const enemyChampMatch = matchup.enemyChampion.toLowerCase().includes(searchEnemyChampion.toLowerCase());
    return myChampMatch && enemyChampMatch;
  });

  function toggleCard(matchupId) {
    expandedCards[matchupId] = !expandedCards[matchupId];
    expandedCards = expandedCards; // Force reactivity
  }

  function handleMouseEnter(matchupId) {
    // Ne pas gérer le hover si la carte est verrouillée
    if (pinnedCards[matchupId]) return;
    
    // Annuler tout timeout existant pour cette carte
    if (hoverTimeouts[matchupId]) {
      clearTimeout(hoverTimeouts[matchupId]);
    }
    // Créer un nouveau timeout de 300ms
    hoverTimeouts[matchupId] = setTimeout(() => {
      expandedCards[matchupId] = true;
      expandedCards = expandedCards;
    }, 300);
  }

  function handleMouseLeave(matchupId) {
    // Ne pas fermer si la carte est verrouillée
    if (pinnedCards[matchupId]) return;
    
    // Annuler le timeout si la souris quitte avant les 300ms
    if (hoverTimeouts[matchupId]) {
      clearTimeout(hoverTimeouts[matchupId]);
      delete hoverTimeouts[matchupId];
    }
    // Fermer immédiatement la carte
    expandedCards[matchupId] = false;
    expandedCards = expandedCards;
  }

  function handleCardClick(matchupId, event) {
    // Ne pas déclencher si on clique sur un bouton d'action ou un élément interactif
    if (event.target.closest('.card-actions, button, .jungle-paths-header, input, .path-note-display')) return;
    
    // Annuler le timeout précédent si existe
    if (clickTimeouts[matchupId]) {
      clearTimeout(clickTimeouts[matchupId]);
      delete clickTimeouts[matchupId];
      return; // Double-clic détecté, ne rien faire
    }
    
    // Créer un timeout pour détecter si c'est un simple clic ou le début d'un double-clic
    clickTimeouts[matchupId] = setTimeout(() => {
      // Toggle l'état verrouillé
      pinnedCards[matchupId] = !pinnedCards[matchupId];
      
      // Si on verrouille, ouvrir la carte
      if (pinnedCards[matchupId]) {
        expandedCards[matchupId] = true;
      }
      
      pinnedCards = pinnedCards;
      expandedCards = expandedCards;
      delete clickTimeouts[matchupId];
    }, 250);
  }

  function toggleJunglePaths(matchupId) {
    expandedJunglePaths[matchupId] = !expandedJunglePaths[matchupId];
    expandedJunglePaths = expandedJunglePaths; // Force reactivity
  }

  function toggleTopLaneData(matchupId) {
    expandedTopLaneData[matchupId] = !expandedTopLaneData[matchupId];
    expandedTopLaneData = expandedTopLaneData; // Force reactivity
  }

  function toggleMidLaneData(matchupId) {
    expandedMidLaneData[matchupId] = !expandedMidLaneData[matchupId];
    expandedMidLaneData = expandedMidLaneData; // Force reactivity
  }

  function togglePathNoteEdit(matchupId, pathIndex) {
    const key = `${matchupId}_${pathIndex}`;
    editingPathNotes[key] = !editingPathNotes[key];
    editingPathNotes = editingPathNotes; // Force reactivity
  }

  function updatePathNote(matchup, pathIndex, newNote) {
    if (matchup.junglePaths && matchup.junglePaths[pathIndex]) {
      if (matchup.junglePaths[pathIndex].camps) {
        matchup.junglePaths[pathIndex].note = newNote;
      } else {
        // Convertir l'ancien format en nouveau format avec note
        matchup.junglePaths[pathIndex] = {
          camps: matchup.junglePaths[pathIndex],
          note: newNote
        };
      }
      dispatch('update', matchup);
    }
  }

  function focusInput(node) {
    node.focus();
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function handleEdit(matchup) {
    dispatch('edit', matchup);
  }

  function handleView(matchup) {
    dispatch('view', matchup);
  }

  function handleDelete(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matchup ?')) {
      dispatch('delete', id);
    }
  }
</script>

<div class="matchup-list">
  <div class="search-filters">
    <div class="search-group">
      <label for="searchMyChampion">🔍 Mon champion</label>
      <input 
        type="text" 
        id="searchMyChampion"
        bind:value={searchMyChampion}
        placeholder="Filtrer par mon champion..."
      />
    </div>
    <div class="search-group">
      <label for="searchEnemyChampion">🔍 Champion adverse</label>
      <input 
        type="text" 
        id="searchEnemyChampion"
        bind:value={searchEnemyChampion}
        placeholder="Filtrer par adversaire..."
      />
    </div>
  </div>

  {#if filteredMatchups.length === 0}
    <div class="empty-state">
      {#if matchups.length === 0}
        <p>Aucun matchup enregistré. Créez votre premier matchup !</p>
      {:else}
        <p>Aucun matchup ne correspond à votre recherche.</p>
      {/if}
    </div>
  {:else}
    <div class="grid">
      {#each filteredMatchups as matchup (matchup.id)}
        <div class="matchup-card" 
             class:expanded={expandedCards[matchup.id]}
             class:pinned={pinnedCards[matchup.id]}
             on:mouseenter={() => handleMouseEnter(matchup.id)}
             on:mouseleave={() => handleMouseLeave(matchup.id)}
             on:click={(e) => handleCardClick(matchup.id, e)}>
          <div class="card-header-compact">
            <div class="champions-compact">
              {#if getChampionImageUrl(matchup.myChampion)}
                <img src="{getChampionImageUrl(matchup.myChampion)}" alt="{matchup.myChampion}" class="champion-icon-compact" />
              {/if}
              <strong>{matchup.myChampion}</strong>
              <span class="vs-compact">VS</span>
              {#if getChampionImageUrl(matchup.enemyChampion)}
                <img src="{getChampionImageUrl(matchup.enemyChampion)}" alt="{matchup.enemyChampion}" class="champion-icon-compact" />
              {/if}
              <strong>{matchup.enemyChampion}</strong>
            </div>
            <div class="card-actions">
              <button on:click={() => handleView(matchup)} class="btn-view" title="Consulter">
                👁️
              </button>
              <button on:click={() => handleEdit(matchup)} class="btn-edit" title="Éditer">
                ✏️
              </button>
              <button on:click={() => handleDelete(matchup.id)} class="btn-delete" title="Supprimer">
                🗑️
              </button>
            </div>
          </div>

          {#if expandedCards[matchup.id]}
            <div class="card-details">
              <div class="info-section">
                {#if matchup.lane}
                  <div class="lane">
                    <span class="label">Lane:</span> {matchup.lane}
                  </div>
                {/if}

                {#if matchup.runes}
                  <div class="runes">
                    <span class="label">Runes:</span>
                    {#if typeof matchup.runes === 'object' && matchup.runes.primaryPath}
                      <div class="rune-paths">
                        <div class="rune-path-item">
                          <strong>{matchup.runes.primaryPath}</strong>
                          <div class="rune-names">
                            {#each matchup.runes.primaryRunes.filter(r => r) as rune}
                              <span class="rune-badge">
                                <img src="{getRuneImagePath(rune.icon)}" alt={rune.name} class="rune-mini-icon" />
                                {rune.name}
                              </span>
                            {/each}
                          </div>
                        </div>
                        {#if matchup.runes.secondaryPath}
                          <div class="rune-path-item secondary">
                            <strong>{matchup.runes.secondaryPath}</strong>
                            <div class="rune-names">
                              {#each matchup.runes.secondaryRunes as rune}
                                <span class="rune-badge">
                                  <img src="{getRuneImagePath(rune.icon)}" alt={rune.name} class="rune-mini-icon" />
                                  {rune.name}
                                </span>
                              {/each}
                            </div>
                          </div>
                        {/if}
                        {#if matchup.runes.shards && matchup.runes.shards.length > 0}
                          <div class="rune-path-item shards">
                            <strong>Fragments</strong>
                            <div class="rune-names">
                              {#each matchup.runes.shards.filter(s => s) as shard}
                                <span class="rune-badge shard-badge">
                                  <img src="{getRuneImagePath(shard.icon)}" alt={shard.stat} class="rune-mini-icon" />
                                  {shard.stat}
                                </span>
                              {/each}
                            </div>
                          </div>
                        {/if}
                      </div>
                    {:else}
                      <div class="rune-list">{matchup.runes}</div>
                    {/if}
                  </div>
                {/if}

                {#if matchup.notes}
                  <div class="notes">
                    <span class="label">Notes:</span>
                    <p>{matchup.notes}</p>
                  </div>
                {/if}
              </div>

              <div class="jungle-section">
                <!-- Top Lane Data -->
                {#if matchup.lane === 'Top' && matchup.topLaneData}
                  <div class="top-lane-section-display">
                    <div class="top-lane-header" on:dblclick|stopPropagation={() => toggleTopLaneData(matchup.id)}>
                      <span class="label">⚔️ Stratégie Top Lane</span>
                      <span class="toggle-icon">{expandedTopLaneData[matchup.id] ? '▼' : '▶'}</span>
                    </div>
                    
                    {#if expandedTopLaneData[matchup.id]}
                      <div class="top-lane-data">
                        {#if matchup.topLaneData.powerSpikes && matchup.topLaneData.powerSpikes.length > 0}
                          <div class="top-section">
                            <span class="label">⚡ Power Spikes:</span>
                            <div class="spikes-display">
                              {#each matchup.topLaneData.powerSpikes as spike}
                                <span class="spike-tag">Niv. {spike.level}</span>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.topLaneData.keyItems && matchup.topLaneData.keyItems.length > 0}
                          <div class="top-section">
                            <span class="label">🛡️ Objets Clés:</span>
                            <div class="items-display">
                              {#each matchup.topLaneData.keyItems as item}
                                <div class="item-display">
                                  <strong>{item.item}</strong>
                                  {#if item.timing}
                                    <span class="timing">@{item.timing}</span>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.topLaneData.waveManagement && matchup.topLaneData.waveManagement.length > 0}
                          <div class="top-section">
                            <span class="label">🌊 Wave Management:</span>
                            <div class="wave-display">
                              {#each matchup.topLaneData.waveManagement as wave}
                                <span class="wave-tag">Niv. {wave.levelRange || wave.level}: {wave.type}</span>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.topLaneData.tpTimings}
                          <div class="top-section">
                            <span class="label">📍 TP Timings:</span>
                            <p class="tp-text">{matchup.topLaneData.tpTimings}</p>
                          </div>
                        {/if}

                        {#if matchup.topLaneData.splitPushDamage || matchup.topLaneData.teamFightUtility}
                          <div class="top-section">
                            <span class="label">🎯 Style:</span>
                            <div class="playstyle-display">
                              {#if matchup.topLaneData.splitPushDamage}
                                <span class="style-tag split">🏰 Split Push</span>
                              {/if}
                              {#if matchup.topLaneData.teamFightUtility}
                                <span class="style-tag teamfight">⚔️ Team Fight</span>
                              {/if}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.topLaneData.earlyGame || matchup.topLaneData.midGame || matchup.topLaneData.lateGame}
                          <div class="top-section">
                            <span class="label">💪 Points Forts:</span>
                            <div class="game-phases-display">
                              {#if matchup.topLaneData.earlyGame}
                                <span class="phase-tag early">🌅 EARLY (0-15)</span>
                              {/if}
                              {#if matchup.topLaneData.midGame}
                                <span class="phase-tag mid">☀️ MID (15-25)</span>
                              {/if}
                              {#if matchup.topLaneData.lateGame}
                                <span class="phase-tag late">🌙 LATE (25+)</span>
                              {/if}
                            </div>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Mid Lane Data -->
                {#if matchup.lane === 'Mid' && matchup.midLaneData}
                  <div class="mid-lane-section-display">
                    <div class="mid-lane-header" on:dblclick|stopPropagation={() => toggleMidLaneData(matchup.id)}>
                      <span class="label">⚡ Stratégie Mid Lane</span>
                      <span class="toggle-icon">{expandedMidLaneData[matchup.id] ? '▼' : '▶'}</span>
                    </div>
                    
                    {#if expandedMidLaneData[matchup.id]}
                      <div class="mid-lane-data">
                        {#if matchup.midLaneData.powerSpikes && matchup.midLaneData.powerSpikes.length > 0}
                          <div class="mid-section">
                            <span class="label">⚡ Power Spikes:</span>
                            <div class="spikes-display">
                              {#each matchup.midLaneData.powerSpikes as spike}
                                <span class="spike-tag">Niv. {spike.level}</span>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.midLaneData.keyItems && matchup.midLaneData.keyItems.length > 0}
                          <div class="mid-section">
                            <span class="label">🛡️ Objets Clés:</span>
                            <div class="items-display">
                              {#each matchup.midLaneData.keyItems as item}
                                <div class="item-display">
                                  <strong>{item.item}</strong>
                                  {#if item.timing}
                                    <span class="timing">@{item.timing}</span>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.midLaneData.waveManagement && matchup.midLaneData.waveManagement.length > 0}
                          <div class="mid-section">
                            <span class="label">🌊 Wave Management:</span>
                            <div class="wave-display">
                              {#each matchup.midLaneData.waveManagement as wave}
                                <span class="wave-tag">Niv. {wave.levelRange || wave.level}: {wave.type}</span>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.midLaneData.roamTimings}
                          <div class="mid-section">
                            <span class="label">📍 Roam Timings:</span>
                            <p class="roam-text">{matchup.midLaneData.roamTimings}</p>
                          </div>
                        {/if}

                        {#if matchup.midLaneData.sidelaneOutplay || matchup.midLaneData.teamFightUtility}
                          <div class="mid-section">
                            <span class="label">🎯 Style:</span>
                            <div class="playstyle-display">
                              {#if matchup.midLaneData.sidelaneOutplay}
                                <span class="style-tag sidelane">🥊 Sidelane Duel</span>
                              {/if}
                              {#if matchup.midLaneData.teamFightUtility}
                                <span class="style-tag teamfight">⚔️ Team Fight</span>
                              {/if}
                            </div>
                          </div>
                        {/if}

                        {#if matchup.midLaneData.earlyGame || matchup.midLaneData.midGame || matchup.midLaneData.lateGame}
                          <div class="mid-section">
                            <span class="label">💪 Points Forts:</span>
                            <div class="game-phases-display">
                              {#if matchup.midLaneData.earlyGame}
                                <span class="phase-tag early">🌅 EARLY (0-15)</span>
                              {/if}
                              {#if matchup.midLaneData.midGame}
                                <span class="phase-tag mid">☀️ MID (15-25)</span>
                              {/if}
                              {#if matchup.midLaneData.lateGame}
                                <span class="phase-tag late">🌙 LATE (25+)</span>
                              {/if}
                            </div>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}

                {#if (matchup.junglePaths && matchup.junglePaths.length > 0) || (matchup.junglePath && matchup.junglePath.length > 0)}
                  <div class="jungle-paths-section">
                    <div class="jungle-paths-header" on:dblclick|stopPropagation={() => toggleJunglePaths(matchup.id)}>
                      <span class="label">🌲 Chemins de Jungle ({matchup.junglePaths?.length || 1})</span>
                      <span class="toggle-icon">{expandedJunglePaths[matchup.id] ? '▼' : '▶'}</span>
                    </div>
                    
                    {#if expandedJunglePaths[matchup.id]}
                      <div class="jungle-paths-content">
                        {#if matchup.junglePaths && matchup.junglePaths.length > 0}
                          {#each matchup.junglePaths as pathData, pathIndex}
                            <div class="jungle-path">
                              <div class="path-title">Path {pathIndex + 1}</div>
                              <div class="jungle-path-flow">
                                {#each (pathData.camps || pathData) as camp, index}
                                  <div class="jungle-camp">
                                    <strong>{camp.camp}</strong>
                                    <span class="camp-time">{camp.time}</span>
                                    {#if camp.smite}
                                      <span class="camp-smite">⚡</span>
                                    {/if}
                                  </div>
                                  {#if index < (pathData.camps || pathData).length - 1}
                                    <span class="path-arrow">→</span>
                                  {/if}
                                {/each}
                              </div>
                              <div class="path-note-edit-section">
                                {#if editingPathNotes[`${matchup.id}_${pathIndex}`]}
                                  <input
                                    type="text"
                                    class="path-note-input-inline"
                                    value={pathData.note || ''}
                                    on:input={(e) => {
                                      pathData.note = e.target.value;
                                    }}
                                    on:blur={(e) => {
                                      updatePathNote(matchup, pathIndex, e.target.value);
                                      togglePathNoteEdit(matchup.id, pathIndex);
                                    }}
                                    on:keydown={(e) => {
                                      if (e.key === 'Enter') {
                                        updatePathNote(matchup, pathIndex, e.target.value);
                                        togglePathNoteEdit(matchup.id, pathIndex);
                                      }
                                      if (e.key === 'Escape') {
                                        togglePathNoteEdit(matchup.id, pathIndex);
                                      }
                                    }}
                                    placeholder="Ajouter une note..."
                                    use:focusInput
                                  />
                                {:else}
                                  <div class="path-note-display" on:click={() => togglePathNoteEdit(matchup.id, pathIndex)}>
                                    {#if pathData.note}
                                      <div class="path-note-small">
                                        <span class="note-icon">📝</span>
                                        <span>{pathData.note}</span>
                                        <span class="edit-hint">✏️</span>
                                      </div>
                                    {:else}
                                      <div class="path-note-empty">
                                        <span class="add-note-icon">➕</span>
                                        <span>Ajouter une note...</span>
                                      </div>
                                    {/if}
                                  </div>
                                {/if}
                              </div>
                            </div>
                          {/each}
                        {:else if matchup.junglePath && matchup.junglePath.length > 0}
                          <!-- Compatibilité avec l'ancien format -->
                          <div class="jungle-path">
                            <div class="jungle-path-flow">
                              {#each matchup.junglePath as camp, index}
                                <div class="jungle-camp">
                                  <strong>{camp.camp}</strong>
                                  <span class="camp-time">{camp.time}</span>
                                  {#if camp.smite}
                                    <span class="camp-smite">⚡</span>
                                  {/if}
                                </div>
                                {#if index < matchup.junglePath.length - 1}
                                  <span class="path-arrow">→</span>
                                {/if}
                              {/each}
                            </div>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="card-footer">
                <small>Créé le {formatDate(matchup.createdAt)}</small>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .matchup-list {
    width: 100%;
  }

  .search-filters {
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
    padding: 20px;
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.2);
    border-radius: 8px;
  }

  .search-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .search-group label {
    color: #c8aa6e;
    font-size: 14px;
    font-weight: bold;
  }

  .search-group input {
    padding: 10px 12px;
    background: rgba(5, 10, 20, 0.8);
    border: 1px solid rgba(200, 170, 100, 0.3);
    border-radius: 6px;
    color: #c8d3e0;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .search-group input:focus {
    outline: none;
    border-color: #c8aa6e;
    box-shadow: 0 0 8px rgba(200, 170, 100, 0.3);
  }

  .search-group input::placeholder {
    color: #7a8a9e;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #7a8a9e;
    font-size: 18px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
  }

  .matchup-card {
    background: rgba(10, 20, 40, 0.6);
    border: 1px solid rgba(200, 170, 100, 0.2);
    border-radius: 8px;
    padding: 12px;
    transition: all 0.3s ease;
    cursor: pointer;
    max-height: 60px;
    overflow: hidden;
  }

  .matchup-card.expanded {
    max-height: none;
    padding: 20px;
    border-color: rgba(200, 170, 100, 0.4);
    box-shadow: 0 4px 16px rgba(200, 170, 110, 0.2);
    transform: translateY(-2px);
  }

  .matchup-card.pinned {
    border-color: rgba(200, 170, 100, 0.6);
    box-shadow: 0 0 12px rgba(200, 170, 100, 0.4);
    grid-column: 1 / -1;
    max-width: 100%;
  }

  .matchup-card.pinned .card-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }

  .matchup-card.pinned .info-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .matchup-card.pinned .jungle-section {
    display: flex;
    flex-direction: column;
  }

  .matchup-card.pinned .card-footer {
    grid-column: 1 / -1;
  }

  .card-header-compact {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .champions-compact {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .champions-compact strong {
    color: #c8aa6e;
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .vs-compact {
    color: #7a8a9e;
    font-size: 12px;
    font-weight: bold;
  }

  .champion-icon-compact {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid rgba(200, 170, 100, 0.5);
    object-fit: cover;
    transition: all 0.2s ease;
  }

  .matchup-card:hover .champion-icon-compact {
    border-color: #c8aa6e;
    box-shadow: 0 0 8px rgba(200, 170, 100, 0.4);
  }

  .card-details {
    margin-top: 15px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }

  .champions {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .champion-label {
    font-size: 12px;
    color: #7a8a9e;
  }

  .champions strong {
    color: #c8aa6e;
    font-size: 18px;
  }

  .vs {
    color: #7a8a9e;
    font-size: 14px;
    margin: 5px 0;
  }

  .card-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn-view,
  .btn-edit,
  .btn-delete {
    background: rgba(200, 170, 100, 0.1);
    border: 1px solid rgba(200, 170, 100, 0.3);
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
  }

  .btn-view:hover {
    background: rgba(100, 200, 150, 0.2);
    border-color: rgba(100, 200, 150, 0.5);
  }

  .btn-edit:hover {
    background: rgba(100, 150, 200, 0.2);
    border-color: rgba(100, 150, 200, 0.5);
  }

  .btn-delete:hover {
    background: rgba(200, 50, 50, 0.2);
    border-color: rgba(200, 50, 50, 0.5);
  }

  .lane,
  .runes,
  .notes {
    margin-bottom: 12px;
  }

  .label {
    color: #c8aa6e;
    font-weight: bold;
    font-size: 14px;
  }

  .lane {
    color: #9ab4d0;
  }

  .rune-paths {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rune-path-item {
    background: rgba(200, 170, 100, 0.1);
    border-left: 3px solid #c8aa6e;
    padding: 8px 12px;
    border-radius: 4px;
  }

  .rune-path-item.secondary {
    border-left-color: #7a8a9e;
  }

  .rune-path-item.shards {
    border-left-color: #6ba3d8;
  }

  .rune-path-item strong {
    color: #c8aa6e;
    font-size: 13px;
    display: block;
    margin-bottom: 5px;
  }

  .rune-names {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .rune-badge {
    background: rgba(10, 20, 40, 0.8);
    border: 1px solid rgba(200, 170, 100, 0.2);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: #c8d3e0;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .rune-badge.shard-badge {
    border-color: rgba(107, 163, 216, 0.3);
  }

  .rune-mini-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
    filter: drop-shadow(0 0 3px rgba(200, 170, 100, 0.3));
  }

  .rune-list {
    color: #9ab4d0;
    margin-top: 5px;
    line-height: 1.6;
  }

  .jungle-paths-section {
    margin-top: 12px;
    border: 1px solid rgba(74, 159, 216, 0.2);
    border-radius: 6px;
    overflow: hidden;
  }

  .jungle-paths-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: rgba(74, 159, 216, 0.1);
    cursor: pointer;
    transition: background 0.2s;
  }

  .jungle-paths-header:hover {
    background: rgba(74, 159, 216, 0.15);
  }

  .toggle-icon {
    color: #4a9fd8;
    font-size: 12px;
    transition: transform 0.2s;
  }

  .jungle-paths-content {
    padding: 12px;
    background: rgba(74, 159, 216, 0.03);
  }

  .jungle-paths {
    margin-top: 12px;
  }

  .jungle-path {
    margin-top: 8px;
    padding: 12px;
    background: rgba(74, 159, 216, 0.05);
    border: 1px solid rgba(74, 159, 216, 0.2);
    border-radius: 6px;
  }

  .jungle-path:first-child {
    margin-top: 0;
  }

  .path-title {
    color: #4a9fd8;
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .path-note-small {
    margin-top: 8px;
    padding: 6px 10px;
    background: rgba(200, 170, 100, 0.05);
    border-left: 2px solid rgba(200, 170, 100, 0.4);
    border-radius: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #c8d3e0;
    position: relative;
  }

  .path-note-small .note-icon {
    font-size: 12px;
  }

  .path-note-small .edit-hint {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 10px;
  }

  .path-note-display:hover .edit-hint {
    opacity: 1;
  }

  .path-note-edit-section {
    margin-top: 8px;
  }

  .path-note-display {
    cursor: pointer;
    transition: all 0.2s;
  }

  .path-note-display:hover .path-note-small {
    background: rgba(200, 170, 100, 0.1);
    border-left-color: rgba(200, 170, 100, 0.6);
  }

  .path-note-empty {
    padding: 6px 10px;
    background: rgba(200, 170, 100, 0.02);
    border: 1px dashed rgba(200, 170, 100, 0.3);
    border-radius: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #7a8a9e;
    font-style: italic;
  }

  .path-note-display:hover .path-note-empty {
    background: rgba(200, 170, 100, 0.05);
    border-color: rgba(200, 170, 100, 0.5);
    color: #c8aa6e;
  }

  .add-note-icon {
    font-size: 10px;
  }

  .path-note-input-inline {
    width: 100%;
    background: rgba(10, 20, 40, 0.6);
    border: 2px solid rgba(200, 170, 100, 0.5);
    border-radius: 4px;
    padding: 8px 10px;
    color: #c8d3e0;
    font-size: 12px;
    font-family: inherit;
  }

  .path-note-input-inline:focus {
    outline: none;
    border-color: #c8aa6e;
    box-shadow: 0 0 0 2px rgba(200, 170, 100, 0.2);
  }

  .jungle-path-flow {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  .jungle-camp {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(74, 159, 216, 0.1);
    border: 1px solid rgba(74, 159, 216, 0.3);
    border-radius: 4px;
    padding: 6px 10px;
    gap: 2px;
  }

  .jungle-camp strong {
    color: #4a9fd8;
    font-size: 12px;
  }

  .jungle-camp .camp-time {
    color: #c8aa6e;
    font-size: 11px;
    font-weight: bold;
  }

  .jungle-camp .camp-smite {
    color: #ffd700;
    font-size: 10px;
  }

  .path-arrow {
    color: #4a9fd8;
    font-size: 18px;
    font-weight: bold;
  }

  .notes p {
    margin: 5px 0 0 0;
    color: #c8d3e0;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .card-footer {
    margin-top: 15px;
    padding-top: 12px;
    border-top: 1px solid rgba(200, 170, 100, 0.1);
  }

  .card-footer small {
    color: #7a8a9e;
    font-size: 12px;
  }

  /* Top Lane Data Styles */
  .top-lane-section-display {
    margin-top: 16px;
    border: 1px solid rgba(200, 100, 100, 0.2);
    border-radius: 6px;
    overflow: hidden;
  }

  .top-lane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: rgba(200, 100, 100, 0.1);
    cursor: pointer;
    transition: background 0.2s;
  }

  .top-lane-header:hover {
    background: rgba(200, 100, 100, 0.15);
  }

  .top-lane-header .label {
    color: #c86464;
    font-weight: bold;
    font-size: 14px;
  }

  .top-lane-data {
    margin-top: 0;
    padding: 12px;
    border-top: none;
    background: rgba(200, 100, 100, 0.03);
  }

  .top-section {
    margin-bottom: 12px;
  }

  .spikes-display,
  .wave-display,
  .playstyle-display {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .spike-tag,
  .wave-tag {
    background: rgba(200, 100, 100, 0.15);
    border: 1px solid rgba(200, 100, 100, 0.4);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    color: #c8d3e0;
    font-weight: bold;
  }

  .items-display {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
  }

  .item-display {
    background: rgba(200, 170, 100, 0.1);
    border-left: 3px solid #c8aa6e;
    padding: 6px 10px;
    border-radius: 3px;
    font-size: 12px;
  }

  .item-display strong {
    color: #c8aa6e;
  }

  .item-display .timing {
    color: #7a8a9e;
    font-size: 10px;
    margin-left: 6px;
  }

  .tp-text {
    margin: 6px 0 0 0;
    color: #c8d3e0;
    font-size: 12px;
    line-height: 1.5;
  }

  .style-tag {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
  }

  .style-tag.split {
    background: rgba(200, 150, 50, 0.15);
    border: 1px solid rgba(200, 150, 50, 0.4);
    color: #c8aa6e;
  }

  .style-tag.teamfight {
    background: rgba(100, 150, 200, 0.15);
    border: 1px solid rgba(100, 150, 200, 0.4);
    color: #6496c8;
  }

  /* Mid Lane Data Styles */
  .mid-lane-section-display {
    margin-top: 16px;
    border: 1px solid rgba(100, 150, 200, 0.2);
    border-radius: 6px;
    overflow: hidden;
  }

  .mid-lane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: rgba(100, 150, 200, 0.1);
    cursor: pointer;
    transition: background 0.2s;
  }

  .mid-lane-header:hover {
    background: rgba(100, 150, 200, 0.15);
  }

  .mid-lane-header .label {
    color: #6495ed;
    font-weight: bold;
    font-size: 14px;
  }

  .mid-lane-data {
    margin-top: 0;
    padding: 12px;
    border-top: none;
    background: rgba(100, 150, 200, 0.03);
  }

  .mid-section {
    margin-bottom: 12px;
  }

  .roam-text {
    margin: 6px 0 0 0;
    color: #c8d3e0;
    font-size: 12px;
    line-height: 1.5;
  }

  .style-tag.sidelane {
    background: rgba(200, 100, 150, 0.15);
    border: 1px solid rgba(200, 100, 150, 0.4);
    color: #c8649b;
  }

  /* Game Phases Styles */
  .game-phases-display {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .phase-tag {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
  }

  .phase-tag.early {
    background: rgba(255, 200, 100, 0.15);
    border: 1px solid rgba(255, 200, 100, 0.4);
    color: #ffb86e;
  }

  .phase-tag.mid {
    background: rgba(255, 220, 100, 0.15);
    border: 1px solid rgba(255, 220, 100, 0.4);
    color: #ffdc6e;
  }

  .phase-tag.late {
    background: rgba(150, 150, 200, 0.15);
    border: 1px solid rgba(150, 150, 200, 0.4);
    color: #9696c8;
  }
</style>

