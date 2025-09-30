# React-Chessboard v5 Migration Fix

## Issue: getPositionObject is not a function

**Error:**
```
TypeError: getPositionObject is not a function
    at ChessBoardComponent (components\game\ChessBoard.tsx:136:9)
```

## Root Cause

The project was using **react-chessboard v1.3.1** which expects **React 18**, but we have **React 19** installed. Additionally, the latest react-chessboard v5 has breaking API changes.

## Version Compatibility

| Package | Old Version | New Version | React Requirement |
|---------|-------------|-------------|-------------------|
| react-chessboard | v1.3.1 | v5.x (latest) | React 19+ |
| react | 19.1.1 | 19.1.1 | Compatible |
| react-dom | 19.1.1 | 19.1.1 | Compatible |

## API Changes (v4 → v5)

### Before (v4/v1 API):
```tsx
<Chessboard
  position={fen}
  boardOrientation="white"
  onPieceDrop={handleDrop}
  arePiecesDraggable={true}
  customBoardStyle={{ borderRadius: '4px' }}
  customDarkSquareStyle={{ backgroundColor: '#779952' }}
  customLightSquareStyle={{ backgroundColor: '#edeed1' }}
/>
```

### After (v5 API):
```tsx
const chessboardOptions = {
  position: fen,
  boardOrientation: 'white',
  onPieceDrop: handleDrop,
  allowDragging: true,  // renamed from arePiecesDraggable
  boardStyle: { borderRadius: '4px' },  // removed 'custom' prefix
  darkSquareStyle: { backgroundColor: '#779952' },  // removed 'custom' prefix
  lightSquareStyle: { backgroundColor: '#edeed1' },  // removed 'custom' prefix
};

<Chessboard options={chessboardOptions} />
```

## Key Changes

### 1. Options Object Pattern
All props are now passed via a single `options` object instead of individual props.

### 2. Renamed Props
- `arePiecesDraggable` → `allowDragging`
- `customBoardStyle` → `boardStyle`
- `customDarkSquareStyle` → `darkSquareStyle`
- `customLightSquareStyle` → `lightSquareStyle`
- `customArrows` → `arrows`
- `customPieces` → `pieces`
- `animationDuration` → `animationDurationInMs`
- `areArrowsAllowed` → `allowDrawingArrows`
- `allowDragOutsideBoard` → `allowDragOffBoard`

### 3. Removed Props
- `arePremovesAllowed` - Handle premoves externally
- `autoPromoteToQueen` - Handle promotion logic externally
- `boardWidth` - Use CSS for sizing (board is now responsive)
- `clearPremovesOnRightClick` - Handle externally
- `customDndBackend` - No longer needed (uses @dnd-kit/core)
- `customDndBackendOptions` - No longer needed

### 4. Split Props
`customNotationStyle` split into:
- `alphaNotationStyle`
- `numericNotationStyle`
- `darkSquareNotationStyle`
- `lightSquareNotationStyle`

## Fix Applied

### 1. Updated Package
```bash
npm install react-chessboard@latest
```

### 2. Updated Component Code

**File:** `components/game/ChessBoard.tsx`

```tsx
// v5 API with options object
const chessboardOptions = {
  position,
  boardOrientation: orientation,
  onPieceDrop: handlePieceDrop,
  allowDragging: isPlaying && isMyTurn(),
  boardStyle: {
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
  },
  darkSquareStyle: { backgroundColor: '#779952' },
  lightSquareStyle: { backgroundColor: '#edeed1' },
};

return (
  <Chessboard options={chessboardOptions} />
);
```

## Benefits of v5

1. **React 19 Compatible** - Native support for latest React
2. **Better Performance** - Uses @dnd-kit instead of react-dnd
3. **Responsive by Default** - No need to specify board width
4. **Cleaner API** - Options object pattern is more maintainable
5. **Better TypeScript Support** - Improved type definitions

## Testing

After update, verify:
- [x] Board renders correctly
- [x] Pieces are draggable (when it's your turn)
- [x] Moves work correctly
- [x] Board orientation works
- [x] Custom styling applied
- [ ] Promotion dialog works (external logic, not chessboard)

## References

- [react-chessboard v5 Upgrade Guide](https://github.com/clariity/react-chessboard/blob/main/docs/G_UpgradeToV5.mdx)
- [react-chessboard Documentation](https://github.com/clariity/react-chessboard)
- [Context7 Library Documentation](/clariity/react-chessboard)