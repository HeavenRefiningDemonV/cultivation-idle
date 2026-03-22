import { useMemo, useState } from 'react';
import { SOUND_IDS } from '../../services/audio/soundIds.js';
import { audio } from '../../services/audio.js';
import './AudioDebugPanel.scss';

export function AudioDebugPanel() {
  const [filter, setFilter] = useState('');
  const normalizedFilter = filter.trim().toLowerCase();

  const filteredIds = useMemo(() => {
    if (!normalizedFilter) return SOUND_IDS;
    return SOUND_IDS.filter((id) => id.toLowerCase().includes(normalizedFilter));
  }, [normalizedFilter]);

  return (
    <div className={'audioDebugPanel'}>
      <div className={'audioDebugControls'}>
        <label className={'audioDebugLabel'}>
          Filter
          <input
            className={'audioDebugInput'}
            type="text"
            value={filter}
            placeholder="Search sound id..."
            onChange={(event) => setFilter(event.target.value)}
          />
        </label>
        <div className={'audioDebugControlActions'}>
          <button
            className={'button-standard audioDebugButton'}
            onClick={() => audio.stopAmbience({ fadeMs: 400 })}
          >
            Stop ambience
          </button>
        </div>
      </div>

      <div className={'audioDebugList'}>
        {filteredIds.length === 0 ? (
          <div className={'audioDebugEmpty'}>No sound ids match the filter.</div>
        ) : (
          filteredIds.map((id) => (
            <div key={id} className={'audioDebugRow'}>
              <div className={'audioDebugId'}>{id}</div>
              <div className={'audioDebugButtons'}>
                <button className={'button-standard audioDebugButton'} onClick={() => audio.play(id)}>
                  Play once
                </button>
                {id.startsWith('amb_') ? (
                  <button
                    className={'button-standard audioDebugButton'}
                    onClick={() => audio.startAmbience(id, { fadeMs: 600 })}
                  >
                    Start ambience
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
