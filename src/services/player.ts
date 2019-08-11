import AsyncStorage from '@react-native-community/async-storage'
import RNFS from 'react-native-fs'
import TrackPlayer from 'react-native-track-player'
import { convertNowPlayingItemClipToNowPlayingItemEpisode, NowPlayingItem } from '../lib/NowPlayingItem'
import { getExtensionFromUrl } from '../lib/utility'
import { PV } from '../resources'
import PlayerEventEmitter from '../services/playerEventEmitter'
import { addOrUpdateHistoryItem, getHistoryItems } from './history'
import { filterItemFromQueueItems, getQueueItems, getQueueItemsLocally, popNextFromQueue, removeQueueItem } from './queue'

// TODO: setupPlayer is a promise, could this cause an async issue?
TrackPlayer.setupPlayer({
  waitForBuffer: false
}).then(() => {
  TrackPlayer.updateOptions({
    capabilities: [
      TrackPlayer.CAPABILITY_JUMP_BACKWARD,
      TrackPlayer.CAPABILITY_JUMP_FORWARD,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_SEEK_TO
    ],
    stopWithApp: true,
    alwaysPauseOnInterruption: true
  })
})

export const PVTrackPlayer = TrackPlayer

export const clearNowPlayingItem = async () => {
  try {
    setNowPlayingItem('')
  } catch (error) {
    throw error
  }
}

export const getClipHasEnded = async () => {
  return AsyncStorage.getItem(PV.Keys.CLIP_HAS_ENDED)
}

export const getContinuousPlaybackMode = async () => {
  const itemString = await AsyncStorage.getItem(PV.Keys.SHOULD_CONTINUOUSLY_PLAY)
  if (itemString) {
    return JSON.parse(itemString)
  }
}

export const getNowPlayingItem = async () => {
  try {
    const itemString = await AsyncStorage.getItem(PV.Keys.NOW_PLAYING_ITEM)
    return itemString ? JSON.parse(itemString) : null
  } catch (error) {
    return null
  }
}

export const handleResumeAfterClipHasEnded = async () => {
  const nowPlayingItem = await getNowPlayingItem()
  const nowPlayingItemEpisode = convertNowPlayingItemClipToNowPlayingItemEpisode(nowPlayingItem)
  await setNowPlayingItem(nowPlayingItemEpisode)
  PlayerEventEmitter.emit(PV.Events.PLAYER_RESUME_AFTER_CLIP_HAS_ENDED)
}

export const playerJumpBackward = async (seconds: number) => {
  const position = await TrackPlayer.getPosition()
  const newPosition = position - seconds
  TrackPlayer.seekTo(newPosition)
  return newPosition
}

export const playerJumpForward = async (seconds: number) => {
  const position = await TrackPlayer.getPosition()
  const newPosition = position + seconds
  TrackPlayer.seekTo(newPosition)
  return newPosition
}

let playerPreviewEndTimeInterval: any = null

export const playerPreviewEndTime = async (endTime: number) => {
  if (playerPreviewEndTimeInterval) {
    clearInterval(playerPreviewEndTimeInterval)
  }

  const previewEndTime = endTime - 3
  await PVTrackPlayer.seekTo(previewEndTime)
  PVTrackPlayer.play()

  playerPreviewEndTimeInterval = setInterval(async () => {
    const currentPosition = await PVTrackPlayer.getPosition()
    if (currentPosition >= endTime) {
      clearInterval(playerPreviewEndTimeInterval)
      PVTrackPlayer.pause()
    }
  }, 500)
}

export const playerPreviewStartTime = async (startTime: number, endTime?: number | null) => {
  if (playerPreviewEndTimeInterval) {
    clearInterval(playerPreviewEndTimeInterval)
  }

  TrackPlayer.seekTo(startTime)
  TrackPlayer.play()

  if (endTime) {
    playerPreviewEndTimeInterval = setInterval(async () => {
      const currentPosition = await PVTrackPlayer.getPosition()
      if (currentPosition >= endTime) {
        clearInterval(playerPreviewEndTimeInterval)
        PVTrackPlayer.pause()
      }
    }, 500)
  }
}

export const setClipHasEnded = async (clipHasEnded: boolean) => {
  await AsyncStorage.setItem(PV.Keys.CLIP_HAS_ENDED, JSON.stringify(clipHasEnded))
}

export const setNowPlayingItem = async (item: NowPlayingItem | string) => {
  if (item) {
    AsyncStorage.setItem(PV.Keys.NOW_PLAYING_ITEM, JSON.stringify(item))
  }
}

const getDownloadedFilePath = (id: string, episodeMediaUrl: string) => {
  const ext = getExtensionFromUrl(episodeMediaUrl)
  return `${RNFS.DocumentDirectoryPath}/${id}${ext}`
}

const checkIfFileIsDownloaded = async (id: string, episodeMediaUrl: string) => {
  let isDownloadedFile = true
  const filePath = getDownloadedFilePath(id, episodeMediaUrl)

  try {
    await RNFS.stat(filePath)
  } catch (innerErr) {
    isDownloadedFile = false
  }
  return isDownloadedFile
}

export const initializePlayerQueue = async () => {
  const queueItems = await getQueueItems()
  let filteredItems = [] as any
  const nowPlayingItemString = await AsyncStorage.getItem(PV.Keys.NOW_PLAYING_ITEM)
  let nowPlayingItem = null
  if (nowPlayingItemString) {
    nowPlayingItem = JSON.parse(nowPlayingItemString)
    filteredItems = filterItemFromQueueItems(queueItems, nowPlayingItem)

    const historyItems = await getHistoryItems()
    const historyItem = historyItems.find((x: NowPlayingItem) =>
      (x.clipId && nowPlayingItem.clipId === x.clipId) || (x.episodeId && nowPlayingItem.episodeId === x.episodeId))
    if (historyItem) nowPlayingItem.userPlaybackPosition = historyItem.userPlaybackPosition
    filteredItems.unshift(nowPlayingItem)
  }

  await addItemsToPlayerQueueNext(filteredItems)

  return nowPlayingItem
}

const getValidQueueItemInsertBeforeId = (items: NowPlayingItem[], queuedTracks: any, currentTrackId?: string) => {
  let indexOfCurrentTrack = -1

  for (let i = 0; queuedTracks.length > i; i++) {
    if (queuedTracks[i].id === currentTrackId) indexOfCurrentTrack = i
  }

  let insertBeforeId = queuedTracks.length > indexOfCurrentTrack + 1 ? queuedTracks[indexOfCurrentTrack + 1].id : null
  if (items.length > 0 && insertBeforeId) {
    if ((items[0].clipId === insertBeforeId || items[0].episodeId === insertBeforeId) &&
      queuedTracks.length > indexOfCurrentTrack + 1) {
      insertBeforeId = queuedTracks[indexOfCurrentTrack + 2].id
    }
  }
  return insertBeforeId
}

export const loadNextFromQueue = async (shouldPlay: boolean) => {
  const item = await popNextFromQueue()
  if (item) await loadTrackFromQueue(item, shouldPlay, false)
  return item
}

export const updateUserPlaybackPosition = async () => {
  const item = await getNowPlayingItem()
  if (item) {
    const lastPosition = await TrackPlayer.getPosition()
    const duration = await TrackPlayer.getDuration()
    if (duration > 0 && lastPosition >= duration - 10) {
      item.userPlaybackPosition = 0
      await addOrUpdateHistoryItem(item)
    } else if (lastPosition > 0) {
      item.userPlaybackPosition = lastPosition
      await addOrUpdateHistoryItem(item)
    }
  }
}

export const loadTrackFromQueue = async (item: NowPlayingItem, shouldPlay: boolean, skipUpdatePlaybackPosition: boolean) => {
  const { clipId, episodeId } = item
  const id = clipId || episodeId
  const playerQueue = await TrackPlayer.getQueue()
  let pvQueueItems = await getQueueItemsLocally()
  if (playerQueue.some((x: any) => (clipId && x.id === clipId) || (!clipId && x.id === episodeId))) {
    pvQueueItems = pvQueueItems.filter((x: any) => (clipId && x.clipId !== clipId) || (!clipId && x.episodeId !== episodeId))
  }

  if (!skipUpdatePlaybackPosition) {
    await updateUserPlaybackPosition()
  }

  try {
    if (id) {
      await TrackPlayer.stop()
      await TrackPlayer.skip(id)
      if (shouldPlay) setTimeout(() => TrackPlayer.play(), 1500)
    }
    if (clipId) PlayerEventEmitter.emit(PV.Events.PLAYER_CLIP_LOADED)
  } catch (error) {
    console.log('loadTrackFromQueue could not skip', error)
    // If track is not found, catch the error, then add it
    await addItemsToPlayerQueueNext([item, ...pvQueueItems], shouldPlay)
  }
  await addOrUpdateHistoryItem(item)
}

export const addItemsToPlayerQueue = async (items: NowPlayingItem[], insertBeforeId: any = null) => {
  const tracks = [] as any
  try {
    for (const item of items) {
      const { clipId, episodeId } = item
      const id = clipId || episodeId
      if (!id) return
      const track = await createTrack(item)
      try {
        await TrackPlayer.getTrack(id)
        await TrackPlayer.remove(id)
        tracks.push(track)
      } catch (error) {
        tracks.push(track)
      }
    }
    await TrackPlayer.add(tracks, insertBeforeId)
  } catch (error) {
    console.log(error)
  }
}

const createNowPlayingItemsFromPlayerTracks = (tracks: any[]) => {
  const items = []
  for (const track of tracks) {
    const item = createNowPlayingItemFromPlayerTrack(track)
    items.push(item)
  }
  return items
}

const createNowPlayingItemFromPlayerTrack = (track: any) => {
  return {
    episodeId: track.id,
    episodeMediaUrl: track.url,
    episodeTitle: track.title,
    podcastTitle: track.artist,
    ...(track.artwork ? { podcastImageUrl: track.artwork } : {})
  }
}

export const addItemsToPlayerQueueNext = async (items: NowPlayingItem[], shouldPlay?: boolean, shouldRemoveFromPVQueue?: boolean) => {
  if (items.length < 1) return
  const queuedTracks = await TrackPlayer.getQueue()
  const currentTrackId = await TrackPlayer.getCurrentTrack()
  const insertBeforeId = getValidQueueItemInsertBeforeId(items, queuedTracks, currentTrackId)
  await addItemsToPlayerQueue(items, insertBeforeId)
  const newQueuedTracks = await TrackPlayer.getQueue()

  if (currentTrackId) {
    const nextItemToPlayId = items[0].clipId || items[0].episodeId
    if (nextItemToPlayId) {
      try {
        await TrackPlayer.stop()
        await TrackPlayer.skip(nextItemToPlayId)
      } catch (error) {
        // NOTE: iOS seems to have a delay after .stop() is called where the whole player queue
        // gets reset/cleared :( In the event that happens, all items are added back to the queue
        const newQueuedTracksAsNowPlayingItems = createNowPlayingItemsFromPlayerTracks(newQueuedTracks)
        await addItemsToPlayerQueue(newQueuedTracksAsNowPlayingItems)
        await TrackPlayer.skip(nextItemToPlayId)
      }
    }
  }

  const newCurrentTrackId = await TrackPlayer.getCurrentTrack()
  const nextItem = items.find((x: NowPlayingItem) => {
    if (x.clipId) return x.clipId === newCurrentTrackId
    if (x.episodeId) return x.episodeId === newCurrentTrackId
    return false
  })

  if (shouldPlay) setTimeout(() => TrackPlayer.play(), 1500)

  if (nextItem) {
    await setNowPlayingItem(nextItem)
    // NOTE: the PLAYER_CLIP_LOADED event listener uses the NOW_PLAYING_ITEM to get clip info
    if (nextItem.clipId) PlayerEventEmitter.emit(PV.Events.PLAYER_CLIP_LOADED)
    await addOrUpdateHistoryItem(nextItem)
    if (shouldRemoveFromPVQueue) await removeQueueItem(nextItem)
  }
}

export const movePlayerItemToNewPosition = async (id: string, insertBeforeId: string) => {
  const playerQueueItems = await TrackPlayer.getQueue()
  if (playerQueueItems.some((x: any) => x.id === id)) {
    try {
      await TrackPlayer.getTrack(id)
      await TrackPlayer.remove(id)
      const pvQueueItems = await getQueueItemsLocally()
      const itemToMove = pvQueueItems.find((x: any) => (x.clipId && x.clipId === id) || (!x.clipId && x.episodeId === id))
      if (itemToMove) {
        const track = await createTrack(itemToMove)
        await TrackPlayer.add([track], insertBeforeId)
      }
    } catch (error) {
      console.log('movePlayerItemToNewPosition error:', error)
    }
  }
}

export const createTrack = async (item: NowPlayingItem) => {
  const { clipId, episodeId, episodeMediaUrl = '', episodeTitle = 'Untitled episode', podcastImageUrl,
    podcastTitle = 'Untitled podcast' } = item
  const id = clipId || episodeId
  let track = null
  if (id) {
    const isDownloadedFile = await checkIfFileIsDownloaded(id, episodeMediaUrl)
    const filePath = getDownloadedFilePath(id, episodeMediaUrl)
  
    if (isDownloadedFile) {
      track = {
        id,
        url: `file://${filePath}`,
        title: episodeTitle,
        artist: podcastTitle,
        ...(podcastImageUrl ? { artwork: podcastImageUrl } : {})
      }
    } else {
      track = {
        id,
        url: episodeMediaUrl,
        title: episodeTitle,
        artist: podcastTitle,
        ...(podcastImageUrl ? { artwork: podcastImageUrl } : {})
      }
    }
  
  }
  return track
}

export const setPlaybackPosition = async (position?: number) => {
  if (position || position === 0 || (position && position > 0)) await TrackPlayer.seekTo(position)
}

// Sometimes the duration is not immediately available for certain episodes.
// For those cases, use a setInterval before adjusting playback position.
export const setPlaybackPositionWhenDurationIsAvailable = async (position: number, trackId?: string, resolveImmediately?: boolean) => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const duration = await TrackPlayer.getDuration()
      const currentTrackId = await TrackPlayer.getCurrentTrack()
      if (duration && duration > 0 && (!trackId || trackId === currentTrackId) && position >= 0) {
        clearInterval(interval)
        await TrackPlayer.seekTo(position)
        resolve()
      }
      if (resolveImmediately) resolve()
    }, 500)
  })
}

export const setPlaybackSpeed = async (rate: number) => {
  await TrackPlayer.setRate(rate)
}

export const togglePlay = async (playbackRate: number) => {
  const state = await TrackPlayer.getState()

  if (state === TrackPlayer.STATE_NONE) {
    TrackPlayer.play()
    TrackPlayer.setRate(playbackRate)
    return
  }

  if (state === TrackPlayer.STATE_PLAYING) {
    TrackPlayer.pause()
  } else {
    TrackPlayer.play()
    TrackPlayer.setRate(playbackRate)
  }
}
