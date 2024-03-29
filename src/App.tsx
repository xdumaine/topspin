import React, { useEffect, useState } from 'react';
import './App.css';
import { useSwipe } from './useSwipe';

const debug = false;
const useStorage = true;

const multiplier = 12;
const conicGradientStops = new Array(20)
  .fill(null)
  .map((_, i) => {
    return [
      'rgb(45, 67, 150) ' + (i * (360 / 20) + i * multiplier) + 'deg',
      'rgb(45, 67, 125) ' + (i * (360 / 20) + i * multiplier) + 'deg',
      'rgb(45, 67, 125) ' + (i * (360 / 20) + (i + 1) * multiplier) + 'deg',
      'rgb(45, 67, 150) ' + (i * (360 / 20) + (i + 1) * multiplier) + 'deg',
    ];
  })
  .flatMap((item) => item);

const isWin = (tiles: Tiles, reversed?: boolean): boolean => {
  let win = true;
  const digits = tiles.map((tile) => tile.digit);
  digits.forEach((digit, i) => {
    if (digit === 20 && (digits[i + 1] === 1 || i === 19)) return;
    if (digit + 1 !== digits[i + 1] && digits[i + 1]) {
      win = false;
    }
  });

  if (!win && !reversed) {
    return isWin(tiles.reverse() as Tiles, true);
  }

  return win;
};

let shuffled = false;
function shuffle(array: any[]) {
  if (shuffled) {
    return array;
  }
  if (debug) {
    const [one, two, three, four, ...rest] = array;
    return [four, three, two, one, ...rest];
  }
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  shuffled = true;

  return array;
}

const savedOrderString = window.localStorage.getItem('order');

const initial: number[] =
  useStorage && savedOrderString
    ? JSON.parse(savedOrderString)
    : shuffle(new Array(20).fill(null).map((_, i) => i + 1));

const saveState = (tiles: Tiles) => {
  const sorted = tiles.sort((a, b) => (a.index[0] < b.index[0] ? -1 : 1));
  const digits = sorted.map((tile) => tile.digit);

  window.localStorage.setItem('order', JSON.stringify(digits));
};

type Tile = {
  digit: number;
  index: [number, React.Dispatch<React.SetStateAction<number>>];
};

type Tiles = Tile[]; // eh, this is technically a tuple of 20 items, but that didn't really help much and just made a big ugly type definition

const moveLeft = (tiles: Tiles) => {
  tiles.forEach((tile) => {
    const [index, setIndex] = tile.index;
    requestAnimationFrame(() => {
      setIndex(index === 1 ? 20 : index - 1);
    });
  });
  return false;
};

const moveRight = (tiles: Tiles) => {
  tiles.forEach((tile) => {
    const [index, setIndex] = tile.index;
    setIndex(index === 20 ? 1 : index + 1);
  });
  return false;
};

const swapTiles = (tiles: Tiles) => {
  const nine = tiles.find((tile) => tile.index[0] === 9)!;
  nine.index[1](12);

  const ten = tiles.find((tile) => tile.index[0] === 10)!;
  ten.index[1](11);

  const eleven = tiles.find((tile) => tile.index[0] === 11)!;
  eleven.index[1](10);

  const twelve = tiles.find((tile) => tile.index[0] === 12)!;
  twelve.index[1](9);
  return false;
};

const reset = () => {
  window.localStorage.removeItem('order');
  window.location.reload();
};

const Board = () => {
  const [helpVisible, setHelpVisible] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [rotations, setRotations] = useState(0);
  const toggleHelp = () => setHelpVisible(!helpVisible);

  const increaseRotations = () => {
    console.log('increasing rotation');
    setRotations((rotations) => {
      console.log('setting rotations', rotations);
      return rotations + 1;
    });
  };
  const reduceRotations = () => setRotations((rotations) => rotations - 1);

  const rotationIndicatorStyle = {
    background: `conic-gradient(${conicGradientStops.join(', ')})`,
    transform: `rotate(${rotations * (360 / 20)}deg)`,
  };

  console.log(rotationIndicatorStyle);

  const tiles = shuffle(
    initial.map((digit, i) => ({
      digit,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      index: useState(i + 1),
    }))
  );

  const tapHandlers = {
    onTapLeft: () => {
      setHelpVisible(false);
      reduceRotations();
      moveLeft(tiles);
    },
    onTapRight: () => {
      setHelpVisible(false);
      increaseRotations();
      moveRight(tiles);
    },
    onTapSwap: () => {
      setSwapped(!swapped);
      setHelpVisible(false);
      swapTiles(tiles);
    },
  };

  const swipeHandlers = useSwipe({
    onSwipedLeft: () => {
      reduceRotations();
      setHelpVisible(false);
      moveLeft(tiles);
    },
    onSwipedRight: () => {
      setHelpVisible(false);
      increaseRotations();
      moveRight(tiles);
    },
    onOtherTouch: () => void 0,
  });

  const [didWin, setDidWin] = useState(false);

  useEffect(() => {
    saveState(tiles);
    setDidWin(isWin(tiles));
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.code) {
        case 'ArrowLeft':
          tapHandlers.onTapLeft();
          break;
        case 'ArrowRight':
          tapHandlers.onTapRight();
          break;
        case 'Space':
          tapHandlers.onTapSwap();
          break;
        default:
          return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Don't forget to clean up
    return function cleanup() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tiles, ...tiles.map((tile) => tile.index[0])]);

  return (
    <>
      <header className="global-controls">
        <button onClick={toggleHelp}>{helpVisible ? '❌' : '🤨'}</button>
        <h3>{didWin ? '🎉' : 'Sort the numbers.'}</h3>
        <button onClick={reset}>🔀</button>
      </header>
      <div {...swipeHandlers} className={`board ${didWin && 'winner'}`}>
        <div
          className={`swapper-indicator ${swapped ? 'swapped' : ''}`}
          onClick={tapHandlers.onTapSwap}
        >
          <span>⬆️</span>
          <span>⬇️</span>
        </div>
        <div
          className={`rotate-indicator`}
          style={rotationIndicatorStyle}
        ></div>
        <div className="swapper" onClick={tapHandlers.onTapSwap}></div>
        <div className="tiles">
          {tiles.map((tile) => (
            <div
              style={{
                transform: `rotate(${
                  (360 / 20) * (tile.index[0] - 1)
                }deg) translate(130px) rotate(-${
                  (360 / 20) * (tile.index[0] - 1)
                }deg)`,
              }}
              key={tile.digit}
              className={`tile`}
            >
              {tile.digit}
            </div>
          ))}
        </div>
      </div>
      <div className="controls">
        <button onClick={tapHandlers.onTapLeft}>↪️</button>
        <button onClick={tapHandlers.onTapSwap}>🔄</button>
        <button onClick={tapHandlers.onTapRight}>↩️</button>
      </div>
      <div className={`info ${helpVisible ? 'open' : 'closed'}`}>
        <div>
          This game is based on TopSpin, the physical puzzle game by Binary Arts
        </div>
        <div>Controls:</div>
        <table>
          <thead>
            <th>Input method</th>
            <th>rotate counterclockwise</th>
            <th>swap highlighted</th>
            <th>rotate clockwise</th>
          </thead>
          <tr>
            <th>Keyboard</th>
            <td>Left</td>
            <td>Space</td>
            <td>Right</td>
          </tr>
          <tr>
            <th>Touch</th>
            <td>Swipe</td>
            <td>Tap</td>
            <td>Swipe</td>
          </tr>
          <tr>
            <th>Buttons</th>
            <td>↪️</td>
            <td>🔄</td>
            <td>↩️</td>
          </tr>
        </table>
        <code>
          <a
            target="_blank"
            href="https://github.com/xdumaine/topspin"
            rel="noreferrer"
          >
            Source
          </a>
        </code>
        <button onClick={toggleHelp}>👍</button>
      </div>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <Board />
    </div>
  );
}

export default App;
