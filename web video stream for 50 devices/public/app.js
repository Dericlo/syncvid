'use strict';

/*
 * Static Firebase Hosting cannot provide true server-side password security.
 * This SHA-256 gate prevents normal visitors from opening the controls.
 * Default password: syncvid50
 * The unlocked website can change the password for the current browser.
 */
const ACCESS_DEFAULT_PASSWORD_SHA256 =
  'a0281adac964ebb0cace176bd70db7feea886590344859b91df0962aba19ac50';
const ACCESS_SESSION_KEY = 'syncvid.access.current';
const ACCESS_PASSWORD_STORAGE_KEY = 'syncvid.access.passwordHash';
let applicationInitialized = false;


const {
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  TokenSource,
  LocalVideoTrack,
  LocalAudioTrack
} = window.LivekitClient;

const STORAGE = Object.freeze({
  room: 'syncvid.lk.static.room',
  tokenServerId: 'syncvid.lk.static.tokenServerId',
  youtubeUrl: 'syncvid.lk.static.youtubeUrl',
  sourceMode: 'syncvid.lk.static.sourceMode',
  loopDelay: 'syncvid.lk.static.loopDelay',
  loopEnabled: 'syncvid.lk.static.loopEnabled',
  rememberPosition: 'syncvid.lk.static.rememberPosition',
  localPosition: 'syncvid.lk.static.localPosition',
  lastRole: 'syncvid.lk.static.lastRole',
  autoRestore: 'syncvid.lk.static.autoRestore',
  lastWasPublishing: 'syncvid.lk.static.lastWasPublishing',
  scheduleEnabled: 'syncvid.lk.static.scheduleEnabled',
  scheduleTimeZone: 'syncvid.lk.static.scheduleTimeZone',
  scheduleStart: 'syncvid.lk.static.scheduleStart',
  scheduleEnd: 'syncvid.lk.static.scheduleEnd',
  scheduleSaturday: 'syncvid.lk.static.scheduleSaturday',
  scheduleSunday: 'syncvid.lk.static.scheduleSunday',
  joinOpen: 'syncvid.lk.static.joinOpen',
  sourceOpen: 'syncvid.lk.static.sourceOpen',
  scheduleOpen: 'syncvid.lk.static.scheduleOpen',
  connectionOpen: 'syncvid.lk.static.connectionOpen',
  currentBuild: 'syncvid.lk.static.currentBuild',
  language: 'syncvid.ui.language'
});

const $ = id => document.getElementById(id);

const el = {
  languageSelect: $('languageSelect'),

  accessGate: $('accessGate'),
  accessForm: $('accessForm'),
  accessPasswordInput: $('accessPasswordInput'),
  accessError: $('accessError'),
  appRoot: $('appRoot'),
  lockAccessButton: $('lockAccessButton'),
  changePasswordButton: $('changePasswordButton'),
  passwordModal: $('passwordModal'),
  changePasswordForm: $('changePasswordForm'),
  currentPasswordInput: $('currentPasswordInput'),
  newPasswordInput: $('newPasswordInput'),
  confirmPasswordInput: $('confirmPasswordInput'),
  changePasswordError: $('changePasswordError'),
  changePasswordSuccess: $('changePasswordSuccess'),
  closePasswordModalButton: $('closePasswordModalButton'),
  cancelPasswordButton: $('cancelPasswordButton'),

  serviceBadge: $('serviceBadge'),
  roleBadge: $('roleBadge'),
  participantBadge: $('participantBadge'),

  roomInput: $('roomInput'),
  tokenServerInput: $('tokenServerInput'),
  joinViewerButton: $('joinViewerButton'),
  joinControllerButton: $('joinControllerButton'),
  copyViewerLinkButton: $('copyViewerLinkButton'),
  leaveRoomButton: $('leaveRoomButton'),
  autoRestoreInput: $('autoRestoreInput'),

  joinPanel: $('joinPanel'),
  controllerPanel: $('controllerPanel'),
  viewerPanel: $('viewerPanel'),
  connectionPanel: $('connectionPanel'),
  controllerSourceSection: $('controllerSourceSection'),
  controllerPlaybackSection: $('controllerPlaybackSection'),
  controllerScheduleSection: $('controllerScheduleSection'),

  sourceModeSelect: $('sourceModeSelect'),
  selectedSourceTitle: $('selectedSourceTitle'),
  controllerActionStatus: $('controllerActionStatus'),
  publishSelectedButton: $('publishSelectedButton'),
  stopPublishButton: $('stopPublishButton'),

  localPanel: $('localPanel'),
  youtubePanel: $('youtubePanel'),
  localFileInput: $('localFileInput'),
  localFileDisplay: $('localFileDisplay'),
  restoreLocalButton: $('restoreLocalButton'),

  youtubeUrlInput: $('youtubeUrlInput'),
  loadYoutubeButton: $('loadYoutubeButton'),
  youtubeDeviceNotice: $('youtubeDeviceNotice'),

  controllerVideoShell: $('controllerVideoShell'),
  controllerPreview: $('controllerPreview'),
  youtubePreviewShell: $('youtubePreviewShell'),
  controllerOverlay: $('controllerOverlay'),

  playButton: $('playButton'),
  pauseButton: $('pauseButton'),
  restartButton: $('restartButton'),
  seekBar: $('seekBar'),
  timeDisplay: $('timeDisplay'),
  loopInput: $('loopInput'),
  loopDelayInput: $('loopDelayInput'),
  rememberPositionInput: $('rememberPositionInput'),
  scheduleEnabledInput: $('scheduleEnabledInput'),
  scheduleTimeZoneInput: $('scheduleTimeZoneInput'),
  scheduleStartInput: $('scheduleStartInput'),
  scheduleEndInput: $('scheduleEndInput'),
  scheduleSaturdayInput: $('scheduleSaturdayInput'),
  scheduleSundayInput: $('scheduleSundayInput'),
  scheduleStatus: $('scheduleStatus'),

  viewerVideoShell: $('viewerVideoShell'),
  remoteVideo: $('remoteVideo'),
  remoteAudio: $('remoteAudio'),
  viewerWaitingText: $('viewerWaitingText'),
  enableSoundButton: $('enableSoundButton'),
  roomStatus: $('roomStatus'),
  mediaStatus: $('mediaStatus'),
  connectionStatus: $('connectionStatus'),
  errorBox: $('errorBox')
};


/* ==========================================================
   Korean / English interface
   Korean is the default language.
   ========================================================== */
const I18N_EXACT_KO = Object.freeze({
  'Video Broadcast': '영상 방송',
  'Enter password': '비밀번호 입력',
  'Enter the access password to open the video control page.':
    '영상 제어 페이지를 열려면 접속 비밀번호를 입력하십시오.',
  'Password': '비밀번호',
  'Open': '열기',
  'Incorrect password.': '비밀번호가 올바르지 않습니다.',
  'Controller': '컨트롤러',
  'Preview, playback, source, and schedule':
    '미리보기, 재생, 소스 및 스케줄',
  'Selected: Local video': '선택됨: 로컬 영상',
  'Ready': '준비',
  'Stop publishing': '송출 중지',
  'Always visible': '항상 표시',
  'Video preview and playback': '영상 미리보기 및 재생',
  'Low-latency mode': '저지연 모드',
  'No active source': '활성 소스 없음',
  'Select a local file or load a YouTube URL/ID.':
    '로컬 파일을 선택하거나 YouTube URL/ID를 불러오십시오.',
  'Play': '재생',
  'Pause': '일시정지',
  'Restart': '처음부터',
  'Loop': '반복',
  'Loop wait (seconds)': '반복 대기 시간(초)',
  'Remember local position': '로컬 재생 위치 기억',
  'SFU + low latency': 'SFU + 저지연',
  'The controller publishes once. Viewers use minimum playout buffering to reduce delay.':
    '컨트롤러는 한 번 송출하고, 뷰어는 최소 재생 버퍼를 사용하여 지연을 줄입니다.',
  'Source and publishing': '소스 및 송출',
  'Choose local video or YouTube and start broadcasting.':
    '로컬 영상 또는 YouTube를 선택하고 송출을 시작합니다.',
  'Source mode': '소스 모드',
  'Local video': '로컬 영상',
  'YouTube / browser tab': 'YouTube / 브라우저 탭',
  'Broadcast source': '송출 소스',
  'Use the button to publish the selected source.':
    '버튼을 눌러 선택한 소스를 송출하십시오.',
  'Publish selected source': '선택 소스 송출',
  'Choose local video': '로컬 영상 선택',
  'Selected file': '선택한 파일',
  'No local video selected': '선택한 로컬 영상 없음',
  'Restore saved local video': '저장된 로컬 영상 복원',
  'YouTube URL or video ID': 'YouTube URL 또는 영상 ID',
  'Load YouTube in controller preview':
    '컨트롤러 미리보기에 YouTube 불러오기',
  'YouTube publishing must be started from the PC Controller. Android tablets should join as Viewer and receive the published stream.':
    'YouTube 송출은 PC 컨트롤러에서 시작해야 합니다. Android 태블릿은 뷰어로 접속하여 송출 영상을 수신하십시오.',
  'This Android tablet is Viewer-only for YouTube. Browser-tab sharing is unavailable here, so use the PC Controller to publish YouTube.':
    '이 Android 태블릿은 YouTube 뷰어 전용입니다. 브라우저 탭 공유를 사용할 수 없으므로 PC 컨트롤러에서 YouTube를 송출하십시오.',
  'Playback schedule': '재생 스케줄',
  'Set the allowed time zone, weekdays, and operating hours.':
    '허용 시간대, 요일 및 운영 시간을 설정합니다.',
  'Allowed operating time': '허용 운영 시간',
  'Use schedule': '스케줄 사용',
  'Time zone': '시간대',
  'Start time': '시작 시간',
  'End time': '종료 시간',
  'Allow Saturday': '토요일 허용',
  'Allow Sunday': '일요일 허용',
  'Checking playback schedule…': '재생 스케줄 확인 중…',
  'Default: Monday–Friday, 09:00–19:00 in Asia/Seoul. Saturday and Sunday are disabled. The controller pauses and unpublishes outside the allowed period.':
    '기본값: Asia/Seoul 기준 월요일~금요일 09:00~19:00. 토요일과 일요일은 비활성화됩니다. 허용 시간 밖에서는 컨트롤러가 재생을 일시정지하고 송출을 중지합니다.',
  'Viewer': '뷰어',
  'Live controller broadcast': '실시간 컨트롤러 방송',
  'Sound ON — 100%': '소리 켜짐 — 100%',
  'Starting sound…': '소리 시작 중…',
  'Enable sound': '소리 켜기',
  'Waiting for the controller to publish a video.':
    '컨트롤러가 영상을 송출할 때까지 기다리는 중입니다.',
  'Step 1': '1단계',
  'Join the broadcast room': '방송 룸 접속',
  'Room ID': '룸 ID',
  'LiveKit sandbox ID or URL': 'LiveKit 샌드박스 ID 또는 URL',
  'Join as viewer with sound': '소리와 함께 뷰어로 접속',
  'Join as controller': '컨트롤러로 접속',
  'Copy viewer link': '뷰어 링크 복사',
  'Leave room': '룸 나가기',
  'Reopen with last role and resume':
    '마지막 역할로 다시 열고 재개',
  'Enable the Token server in LiveKit Cloud Project Settings and paste its public ID above. Use only one controller per room.':
    'LiveKit Cloud 프로젝트 설정에서 Token server를 활성화하고 공개 ID를 위에 붙여 넣으십시오. 한 룸에는 컨트롤러 한 대만 사용하십시오.',
  'Status': '상태',
  'Connection status': '연결 상태',
  'LiveKit standby': 'LiveKit 대기',
  'LiveKit online': 'LiveKit 온라인',
  'LiveKit offline': 'LiveKit 오프라인',
  'Not joined': '미접속',
  'Change password': '비밀번호 변경',
  'Lock': '잠금',
  'Room': '룸',
  'Media': '미디어',
  'No active stream': '활성 스트림 없음',
  'LiveKit': 'LiveKit',
  'Disconnected': '연결 끊김',
  'Connected': '연결됨',
  'Testing mode:': '테스트 모드:',
  'LiveKit Cloud’s public token server requires no backend, but it does not securely enforce Controller and Viewer permissions. Use a private, difficult-to-guess room ID.':
    'LiveKit Cloud 공개 토큰 서버는 백엔드가 필요 없지만 컨트롤러와 뷰어 권한을 안전하게 강제하지 않습니다. 추측하기 어려운 비공개 룸 ID를 사용하십시오.',
  'Security': '보안',
  'Current password': '현재 비밀번호',
  'New password': '새 비밀번호',
  'Confirm new password': '새 비밀번호 확인',
  'Use at least 4 characters. The changed password is saved in this browser.':
    '4자 이상 사용하십시오. 변경한 비밀번호는 이 브라우저에 저장됩니다.',
  'Cancel': '취소',
  'Save password': '비밀번호 저장',
  'Schedule disabled — playback is always allowed.':
    '스케줄 비활성화 — 항상 재생할 수 있습니다.',
  'Schedule is invalid. End time must be later than start time.':
    '스케줄이 올바르지 않습니다. 종료 시간은 시작 시간보다 늦어야 합니다.',
  'Invalid time zone. Example: Asia/Seoul':
    '시간대가 올바르지 않습니다. 예: Asia/Seoul',
  'Playback is outside the configured schedule.':
    '현재 시간은 설정된 재생 스케줄 밖입니다.',
  'Publish local video': '로컬 영상 송출',
  'Publish YouTube from this page': '이 페이지에서 YouTube 송출',
  'Publish YouTube from PC controller':
    'PC 컨트롤러에서 YouTube 송출',
  'Android tablet: join as Viewer for YouTube':
    'Android 태블릿: YouTube는 뷰어로 접속',
  'Choose a local video': '로컬 영상을 선택하십시오.',
  'Local source ready': '로컬 소스 준비 완료',
  'YouTube source ready': 'YouTube 소스 준비 완료',
  'YouTube ready': 'YouTube 준비 완료',
  'No active publication': '활성 송출 없음',
  'Local video playing': '로컬 영상 재생 중',
  'Broadcast active': '방송 송출 중',
  'Publish failed': '송출 실패',
  'Starting local video…': '로컬 영상 시작 중…',
  'Choose the YouTube tab and enable tab audio…':
    'YouTube 탭을 선택하고 탭 오디오를 활성화하십시오…',
  'Select this SyncVid tab and enable Share tab audio…':
    '현재 SyncVid 탭을 선택하고 탭 오디오 공유를 활성화하십시오…',
  'Click Play or Publish to continue':
    '계속하려면 재생 또는 송출을 누르십시오.',
  'Click Publish YouTube to share the tab':
    '탭을 공유하려면 YouTube 송출을 누르십시오.',
  'Connected; choose a source': '연결됨; 소스를 선택하십시오.',
  'Requesting LiveKit token…': 'LiveKit 토큰 요청 중…',
  'Receiving video from controller':
    '컨트롤러 영상 수신 중',
  'Viewer link copied': '뷰어 링크가 복사되었습니다.',
  'Blocked by schedule': '스케줄에 의해 차단됨',
  'Waiting for allowed time': '허용 시간 대기 중',
  'Stopped by playback schedule':
    '재생 스케줄에 의해 중지됨',
  'No saved local video to resume':
    '재개할 저장된 로컬 영상이 없습니다.',
  'Restoring last session…': '마지막 세션 복원 중…',
  'Automatic restore failed': '자동 복원 실패',
  'YouTube restored; tab-sharing approval is required':
    'YouTube가 복원되었습니다. 탭 공유 승인이 필요합니다.',
  'Tablet is ready as Viewer; YouTube publishing stays on the PC':
    '태블릿이 뷰어로 준비되었습니다. YouTube 송출은 PC에서 수행합니다.',
  'Use the PC Controller to publish YouTube':
    'PC 컨트롤러에서 YouTube를 송출하십시오.',
  'Publish YouTube from the PC Controller. Android tablets are Viewer-only for YouTube.':
    'PC 컨트롤러에서 YouTube를 송출하십시오. Android 태블릿은 YouTube 뷰어 전용입니다.',
  'No saved local video was found.':
    '저장된 로컬 영상을 찾을 수 없습니다.',
  'No saved local video exists in this browser.':
    '이 브라우저에 저장된 로컬 영상이 없습니다.',
  'Choose or restore a local video first.':
    '먼저 로컬 영상을 선택하거나 복원하십시오.',
  'The local video could not be loaded.':
    '로컬 영상을 불러올 수 없습니다.',
  'The selected source has no video track.':
    '선택한 소스에 영상 트랙이 없습니다.',
  'Join the room as Controller first.':
    '먼저 컨트롤러로 룸에 접속하십시오.',
  'No browser-tab video track was selected.':
    '브라우저 탭 영상 트랙이 선택되지 않았습니다.',
  'The browser still blocked audio playback.':
    '브라우저가 여전히 오디오 재생을 차단했습니다.',
  'The LiveKit browser SDK could not be loaded.':
    'LiveKit 브라우저 SDK를 불러올 수 없습니다.',
  'Enter the LiveKit sandbox ID or sandbox URL.':
    'LiveKit 샌드박스 ID 또는 URL을 입력하십시오.',
  'The LiveKit sandbox URL is invalid.':
    'LiveKit 샌드박스 URL이 올바르지 않습니다.',
  'The URL must end with .sandbox.livekit.io':
    'URL은 .sandbox.livekit.io로 끝나야 합니다.',
  'Invalid LiveKit sandbox ID. Example: syncvideocgs-2gke1g':
    'LiveKit 샌드박스 ID가 올바르지 않습니다. 예: syncvideocgs-2gke1g',
  'Enter a valid YouTube URL or 11-character video ID.':
    '올바른 YouTube URL 또는 11자리 영상 ID를 입력하십시오.',
  'YouTube Player API did not become ready.':
    'YouTube Player API가 준비되지 않았습니다.',
  'This browser cannot capture a local video element. Use Chrome or Edge.':
    '이 브라우저에서는 로컬 영상 요소를 캡처할 수 없습니다. Chrome 또는 Edge를 사용하십시오.',
  'The new password must contain at least 4 characters.':
    '새 비밀번호는 4자 이상이어야 합니다.',
  'The new password confirmation does not match.':
    '새 비밀번호 확인이 일치하지 않습니다.',
  'The current password is incorrect.':
    '현재 비밀번호가 올바르지 않습니다.',
  'Password changed. Sign in again with the new password.':
    '비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인하십시오.',
  'The password could not be saved in this browser.':
    '이 브라우저에 비밀번호를 저장할 수 없습니다.',
  'This browser cannot check the password securely.':
    '이 브라우저에서는 비밀번호를 안전하게 확인할 수 없습니다.'
});

const I18N_PREFIX_KO = Object.freeze({
  'Publishing: ': '송출 중: ',
  'YouTube player error: ': 'YouTube 플레이어 오류: ',
  'Sound could not start: ': '소리를 시작할 수 없습니다: ',
  'Local loop restart failed: ': '로컬 반복 재시작 실패: ',
  'Could not load local video: ': '로컬 영상 불러오기 실패: ',
  'Automatic schedule resume failed: ': '스케줄 자동 재개 실패: ',
  'Could not restore the last session: ': '마지막 세션 복원 실패: '
});

const I18N_SKIP_IDS = new Set([
  // Android automatic-viewer wrappers compare this text with "Viewer".
  'roleBadge'
]);

let currentLanguage = 'ko';
let languageObserver = null;
const englishTextByNode = new WeakMap();

function normalizedUiText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function translateWeekdayKo(value) {
  return String(value)
    .replace(/\bMon\b/g, '월')
    .replace(/\bTue\b/g, '화')
    .replace(/\bWed\b/g, '수')
    .replace(/\bThu\b/g, '목')
    .replace(/\bFri\b/g, '금')
    .replace(/\bSat\b/g, '토')
    .replace(/\bSun\b/g, '일');
}

function translateUiTextToKorean(value) {
  const text = normalizedUiText(value);

  if (!text) return text;

  if (Object.prototype.hasOwnProperty.call(I18N_EXACT_KO, text)) {
    return I18N_EXACT_KO[text];
  }

  for (const [prefix, translatedPrefix] of Object.entries(I18N_PREFIX_KO)) {
    if (text.startsWith(prefix)) {
      return translatedPrefix + text.slice(prefix.length);
    }
  }

  let match = /^(\d+) participant(?:s)?$/.exec(text);
  if (match) return `${match[1]}명 접속`;

  match = /^Selected: Local video — (.+)$/.exec(text);
  if (match) return `선택됨: 로컬 영상 — ${match[1]}`;

  match = /^Selected: YouTube in controller preview$/.exec(text);
  if (match) return '선택됨: 컨트롤러 미리보기의 YouTube';

  match = /^Looping in ([\d.]+) second\(s\)$/.exec(text);
  if (match) return `${match[1]}초 후 반복 재생`;

  match = /^Playback allowed now — (.+)$/.exec(text);
  if (match) return `현재 재생 허용 — ${translateWeekdayKo(match[1])}`;

  match = /^Playback blocked now — (.+)$/.exec(text);
  if (match) return `현재 재생 차단 — ${translateWeekdayKo(match[1])}`;

  match = /^(.+) \/ controller$/i.exec(text);
  if (match) return `${match[1]} / 컨트롤러`;

  match = /^(.+) \/ viewer$/i.exec(text);
  if (match) return `${match[1]} / 뷰어`;

  if (text.endsWith(' (browser hides the full PC path)')) {
    return text.replace(
      ' (browser hides the full PC path)',
      ' (브라우저에서 전체 PC 경로를 숨깁니다)'
    );
  }

  return text;
}

function shouldSkipTranslationNode(node) {
  const parent = node && node.parentElement;
  if (!parent) return true;

  if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) {
    return true;
  }

  if (parent.closest('#languageSwitcher')) {
    return true;
  }

  for (const id of I18N_SKIP_IDS) {
    if (parent.id === id || parent.closest(`#${id}`)) {
      return true;
    }
  }

  return false;
}

function preserveTextWhitespace(source, translated) {
  const leading = (String(source).match(/^\s*/) || [''])[0];
  const trailing = (String(source).match(/\s*$/) || [''])[0];
  return leading + translated + trailing;
}

function translateTextNode(node, forceStoreEnglish = false) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  if (shouldSkipTranslationNode(node)) return;

  const current = node.nodeValue || '';
  const normalized = normalizedUiText(current);
  if (!normalized) return;

  if (
    forceStoreEnglish ||
    !englishTextByNode.has(node) ||
    currentLanguage === 'ko'
  ) {
    const knownEnglish = englishTextByNode.get(node);
    const knownKorean = knownEnglish
      ? translateUiTextToKorean(knownEnglish)
      : null;

    if (
      !knownEnglish ||
      normalized !== normalizedUiText(knownKorean)
    ) {
      englishTextByNode.set(node, current);
    }
  }

  const english = englishTextByNode.get(node) || current;

  if (currentLanguage === 'ko') {
    const translated = translateUiTextToKorean(english);
    node.nodeValue = preserveTextWhitespace(english, translated);
  } else {
    node.nodeValue = english;
  }
}

function translateSubtree(root, forceStoreEnglish = false) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root, forceStoreEnglish);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE &&
      root.nodeType !== Node.DOCUMENT_NODE) {
    return;
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  let node;
  while ((node = walker.nextNode())) {
    translateTextNode(node, forceStoreEnglish);
  }
}

function updateTranslatedInputValues() {
  if (el.localFileDisplay) {
    const noFileEnglish = 'No local video selected';
    const noFileKorean = I18N_EXACT_KO[noFileEnglish];

    if (
      el.localFileDisplay.value === noFileEnglish ||
      el.localFileDisplay.value === noFileKorean
    ) {
      el.localFileDisplay.value =
        currentLanguage === 'ko'
          ? noFileKorean
          : noFileEnglish;
    }
  }

  document.documentElement.lang =
    currentLanguage === 'ko' ? 'ko' : 'en';

  document.title =
    currentLanguage === 'ko'
      ? 'SyncVid 영상 방송'
      : 'SyncVid Video Broadcast';
}

function observeLanguageChanges() {
  if (languageObserver) {
    languageObserver.disconnect();
  }

  languageObserver = new MutationObserver(mutations => {
    languageObserver.disconnect();

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        translateTextNode(mutation.target, true);
      }

      for (const added of mutation.addedNodes || []) {
        translateSubtree(added, true);
      }
    }

    updateTranslatedInputValues();
    languageObserver.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  });

  languageObserver.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true
  });
}

function applyInterfaceLanguage(language) {
  currentLanguage = language === 'en' ? 'en' : 'ko';

  if (languageObserver) {
    languageObserver.disconnect();
  }

  translateSubtree(document.body);
  updateTranslatedInputValues();

  if (el.languageSelect) {
    el.languageSelect.value = currentLanguage;
  }

  save(STORAGE.language, currentLanguage);
  observeLanguageChanges();
}

function initializeInterfaceLanguage() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lang');

  const saved =
    readString(STORAGE.language, 'ko');

  const initial =
    requested === 'en' || requested === 'ko'
      ? requested
      : (saved === 'en' ? 'en' : 'ko');

  applyInterfaceLanguage(initial);

  if (el.languageSelect) {
    el.languageSelect.addEventListener('change', () => {
      applyInterfaceLanguage(el.languageSelect.value);
    });
  }
}

function isDesktopControllerMode() {
  try {
    return new URLSearchParams(window.location.search)
      .get('desktop') === 'controller';
  } catch (error) {
    return false;
  }
}

let room = null;
let role = 'none';
let sourceMode = 'local';

let localRecord = null;
let localObjectUrl = null;
let publishedStream = null;
let publishedTracks = [];
let loopTimer = null;
let positionTimer = null;
let loopRestarting = false;
let scheduleLastAllowed = null;
let scheduleTransitionBusy = false;

let youtubePlayer = null;
let youtubeReady = false;
let pendingYoutubeVideoId = '';
let viewerPlaybackRetryTimers = [];
let publishBusy = false;

function save(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    // Browser storage is optional.
  }
}

function readBoolean(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (value === 'true') return true;
    if (value === 'false') return false;
  } catch (error) {
    // Continue with fallback.
  }

  return fallback;
}

function readNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch (error) {
    return fallback;
  }
}


function readString(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function cleanLegacyBrowserCaches() {
  // Firebase serves only the current public files. Remove any old same-origin
  // service-worker or Cache Storage entries left by earlier experiments.
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(registrations =>
          Promise.all(registrations.map(registration => registration.unregister()))
        )
        .catch(() => {});
    }
  } catch (error) {
    // Service workers are optional.
  }

  try {
    if ('caches' in window) {
      caches.keys()
        .then(names => Promise.all(names.map(name => caches.delete(name))))
        .catch(() => {});
    }
  } catch (error) {
    // Cache Storage is optional.
  }
}

function parseClockMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ''));

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function scheduleState(now = new Date()) {
  if (!el.scheduleEnabledInput.checked) {
    return {
      allowed: true,
      message: 'Schedule disabled — playback is always allowed.'
    };
  }

  const timeZone =
    el.scheduleTimeZoneInput.value.trim() ||
    'Asia/Seoul';

  const startMinutes =
    parseClockMinutes(el.scheduleStartInput.value);

  const endMinutes =
    parseClockMinutes(el.scheduleEndInput.value);

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes
  ) {
    return {
      allowed: false,
      invalid: true,
      message: 'Schedule is invalid. End time must be later than start time.'
    };
  }

  let parts;

  try {
    parts = new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      }
    ).formatToParts(now);
  } catch (error) {
    return {
      allowed: false,
      invalid: true,
      message: 'Invalid time zone. Example: Asia/Seoul'
    };
  }

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  const weekday = values.weekday;
  const currentMinutes =
    Number(values.hour) * 60 +
    Number(values.minute);

  const isSaturday = weekday === 'Sat';
  const isSunday = weekday === 'Sun';
  const weekdayAllowed =
    (!isSaturday && !isSunday) ||
    (isSaturday && el.scheduleSaturdayInput.checked) ||
    (isSunday && el.scheduleSundayInput.checked);

  const withinHours =
    currentMinutes >= startMinutes &&
    currentMinutes < endMinutes;

  const allowed = weekdayAllowed && withinHours;
  const localClock =
    String(values.hour).padStart(2, '0') +
    ':' +
    String(values.minute).padStart(2, '0') +
    ':' +
    String(values.second).padStart(2, '0');

  return {
    allowed,
    timeZone,
    weekday,
    localClock,
    message: allowed
      ? `Playback allowed now — ${weekday} ${localClock} (${timeZone})`
      : `Playback blocked now — ${weekday} ${localClock} (${timeZone})`
  };
}

function updateScheduleStatus() {
  const state = scheduleState();

  el.scheduleStatus.textContent = state.message;
  el.scheduleStatus.classList.toggle('allowed', state.allowed);
  el.scheduleStatus.classList.toggle('blocked', !state.allowed);

  return state;
}

function saveScheduleSettings() {
  save(STORAGE.scheduleEnabled, el.scheduleEnabledInput.checked);
  save(STORAGE.scheduleTimeZone, el.scheduleTimeZoneInput.value.trim());
  save(STORAGE.scheduleStart, el.scheduleStartInput.value);
  save(STORAGE.scheduleEnd, el.scheduleEndInput.value);
  save(STORAGE.scheduleSaturday, el.scheduleSaturdayInput.checked);
  save(STORAGE.scheduleSunday, el.scheduleSundayInput.checked);
}

function requireAllowedSchedule() {
  const state = updateScheduleStatus();

  if (!state.allowed) {
    throw new Error(
      state.invalid
        ? state.message
        : 'Playback is outside the configured schedule.'
    );
  }

  return state;
}

function showError(message) {
  el.errorBox.textContent = message;
  el.errorBox.classList.remove('hidden');
  el.connectionPanel.open = true;
  savePanelStates();
}

function clearError() {
  el.errorBox.textContent = '';
  el.errorBox.classList.add('hidden');
}

function setAction(message) {
  el.controllerActionStatus.textContent = message;
}

function setServiceState(state) {
  el.serviceBadge.className = 'badge';

  if (state === 'online') {
    el.serviceBadge.textContent = 'LiveKit online';
    el.serviceBadge.classList.add('online');
  } else if (state === 'offline') {
    el.serviceBadge.textContent = 'LiveKit offline';
    el.serviceBadge.classList.add('offline');
  } else {
    el.serviceBadge.textContent = 'LiveKit standby';
  }
}


function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || '');
}

function isTabletViewerApp() {
  return /SyncVidTablet/i.test(navigator.userAgent || '');
}

function canPublishYoutubeFromThisDevice() {
  return Boolean(
    !isAndroidDevice() &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );
}

function updateViewerVideoFit() {
  if (!el.viewerVideoShell || !el.remoteVideo) return;

  const width = Number(el.remoteVideo.videoWidth) || 0;
  const height = Number(el.remoteVideo.videoHeight) || 0;

  if (width > 0 && height > 0) {
    el.viewerVideoShell.style.aspectRatio =
      width + ' / ' + height;
  }
}

function updateControllerPublishingAvailability() {
  if (!el.publishSelectedButton) return;

  const youtubeUnavailable =
    sourceMode === 'youtube' &&
    !canPublishYoutubeFromThisDevice();

  if (el.youtubeDeviceNotice) {
    el.youtubeDeviceNotice.classList.toggle(
      'hidden',
      !youtubeUnavailable
    );
  }

  if (youtubeUnavailable) {
    el.publishSelectedButton.disabled = true;
    el.publishSelectedButton.textContent =
      'Publish YouTube from PC controller';

    if (role === 'controller') {
      setAction('Android tablet: join as Viewer for YouTube');
    }
    return;
  }

  el.publishSelectedButton.disabled = publishBusy;
  el.publishSelectedButton.textContent =
    sourceMode === 'local'
      ? 'Publish local video'
      : 'Publish YouTube from this page';
}

function setRole(nextRole) {
  role = nextRole;

  document.body.classList.toggle(
    'viewer-mode',
    role === 'viewer'
  );

  document.body.classList.toggle(
    'tablet-viewer-app',
    role === 'viewer' && isTabletViewerApp()
  );

  el.roleBadge.className = 'badge';
  el.controllerPanel.classList.toggle(
    'hidden',
    role !== 'controller'
  );
  el.viewerPanel.classList.toggle(
    'hidden',
    role !== 'viewer'
  );

  if (role === 'controller') {
    el.roleBadge.textContent = 'Controller';
    el.roleBadge.classList.add('controller');
  } else if (role === 'viewer') {
    el.roleBadge.textContent = 'Viewer';
    el.roleBadge.classList.add('viewer');
  } else {
    el.roleBadge.textContent = 'Not joined';
    el.joinPanel.open = true;
  }

  updateControllerPublishingAvailability();
  savePanelStates();
}

function savePanelStates() {
  save(STORAGE.joinOpen, el.joinPanel.open);
  save(STORAGE.sourceOpen, el.controllerSourceSection.open);
  save(STORAGE.scheduleOpen, el.controllerScheduleSection.open);
  save(STORAGE.connectionOpen, el.connectionPanel.open);
}

function selectControllerMenu(section) {
  if (section === 'source') {
    el.controllerSourceSection.open = true;
  } else if (section === 'schedule') {
    el.controllerScheduleSection.open = true;
  }

  savePanelStates();
}

function applyLowLatencyTrack(track) {
  try {
    if (track && typeof track.setPlayoutDelay === 'function') {
      track.setPlayoutDelay(0);
    }
  } catch (error) {
    // Some browsers may ignore explicit playout-delay requests.
  }
}

function preparePublishedMediaTrack(mediaTrack) {
  if (!mediaTrack) return;

  try {
    mediaTrack.contentHint =
      mediaTrack.kind === 'video'
        ? 'motion'
        : 'music';
  } catch (error) {
    // contentHint is optional.
  }
}

function sanitizeRoom(value) {
  const roomName = value.trim();

  if (!/^[A-Za-z0-9_-]{1,60}$/.test(roomName)) {
    throw new Error(
      'Room ID must use 1–60 letters, numbers, hyphens, or underscores.'
    );
  }

  return roomName;
}

function normalizeTokenServerId(value) {
  const text =
    String(value || '').trim();

  if (!text) {
    throw new Error(
      'Enter the LiveKit sandbox ID or sandbox URL.'
    );
  }

  let sandboxId = text;

  if (/^https?:\/\//i.test(text)) {
    let parsed;

    try {
      parsed = new URL(text);
    } catch (error) {
      throw new Error(
        'The LiveKit sandbox URL is invalid.'
      );
    }

    const host =
      parsed.hostname.toLowerCase();

    if (
      !host.endsWith(
        '.sandbox.livekit.io'
      )
    ) {
      throw new Error(
        'The URL must end with .sandbox.livekit.io'
      );
    }

    sandboxId =
      host.slice(
        0,
        -'.sandbox.livekit.io'.length
      );
  } else {
    sandboxId = sandboxId
      .replace(
        /\.sandbox\.livekit\.io\/?$/i,
        ''
      )
      .replace(/^\/+|\/+$/g, '');
  }

  if (
    !/^[A-Za-z0-9][A-Za-z0-9_-]{2,119}$/
      .test(sandboxId)
  ) {
    throw new Error(
      'Invalid LiveKit sandbox ID. Example: syncvideocgs-2gke1g'
    );
  }

  return sandboxId;
}


function updateParticipantCount() {
  if (!room) {
    el.participantBadge.textContent = '0 participants';
    return;
  }

  const count = room.remoteParticipants.size + 1;

  el.participantBadge.textContent =
    count +
    (count === 1 ? ' participant' : ' participants');
}

function configureRoomEvents(currentRoom) {
  currentRoom.on(
    RoomEvent.Connected,
    () => {
      setServiceState('online');
      el.connectionStatus.textContent = 'Connected';
      updateParticipantCount();
    }
  );

  currentRoom.on(
    RoomEvent.Disconnected,
    () => {
      setServiceState('offline');
      el.connectionStatus.textContent = 'Disconnected';
      updateParticipantCount();
    }
  );

  currentRoom.on(
    RoomEvent.ParticipantConnected,
    updateParticipantCount
  );

  currentRoom.on(
    RoomEvent.ParticipantDisconnected,
    updateParticipantCount
  );

  currentRoom.on(
    RoomEvent.TrackSubscribed,
    (track, publication, participant) => {
      if (role !== 'viewer') {
        return;
      }

      applyLowLatencyTrack(track);

      if (track.kind === Track.Kind.Video) {
        track.attach(el.remoteVideo);

        el.remoteVideo.addEventListener(
          'loadedmetadata',
          updateViewerVideoFit,
          { once: true }
        );

        el.remoteVideo.addEventListener(
          'resize',
          updateViewerVideoFit
        );

        /*
         * The remote video element stays muted so browser autoplay can show
         * video immediately. Audio is played through the separate audio element.
         */
        el.remoteVideo.muted = true;

        updateViewerVideoFit();

        el.remoteVideo
          .play()
          .catch(() => {
            // A later track event or user interaction can retry playback.
          });

        el.viewerWaitingText.classList.add(
          'hidden'
        );

        el.mediaStatus.textContent =
          'Receiving video from controller';
      }

      if (track.kind === Track.Kind.Audio) {
        track.attach(el.remoteAudio);

        el.remoteAudio.muted = false;
        el.remoteAudio.volume = 1;

        scheduleViewerPlaybackRetries();
      }
    }
  );

  currentRoom.on(
    RoomEvent.TrackUnsubscribed,
    track => {
      track.detach();
    }
  );

  currentRoom.on(
    RoomEvent.AudioPlaybackStatusChanged,
    () => {
      if (role !== 'viewer') return;

      if (!currentRoom.canPlaybackAudio) {
        el.enableSoundButton.textContent =
          'Enable sound';
      } else {
        scheduleViewerPlaybackRetries();
      }
    }
  );
}

async function joinRoom(nextRole) {
  clearError();

  const roomName =
    sanitizeRoom(el.roomInput.value);

  const tokenServerId =
    normalizeTokenServerId(
      el.tokenServerInput.value
    );

  await leaveRoom({ forgetRole: false });

  setRole(nextRole);
  setServiceState('standby');

  el.connectionStatus.textContent =
    'Requesting LiveKit token…';

  save(STORAGE.room, roomName);
  save(STORAGE.tokenServerId, tokenServerId);

  /*
   * LiveKit Cloud creates the token. Firebase Hosting remains fully static.
   * The public token server is intended for development/testing.
   */
  const tokenSource =
    TokenSource.sandboxTokenServer(
      tokenServerId
    );

  const credentials =
    await tokenSource.fetch({
      roomName: roomName
    });

  room = new Room({
    /*
     * Keep the viewer subscription active even when a collapsible UI section
     * is closed. Minimum playout delay is applied to each subscribed track.
     */
    adaptiveStream: {
      pixelDensity: 1
    },
    dynacast: true,
    singlePeerConnection: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
      frameRate: 30
    },
    publishDefaults: {
      simulcast: true,
      videoCodec: 'h264',
      backupCodec: {
        codec: 'vp8',
        encoding: {
          maxBitrate: 900000,
          maxFramerate: 20
        }
      },
      degradationPreference: 'maintain-framerate',
      videoSimulcastLayers: [
        VideoPresets.h180,
        VideoPresets.h360
      ]
    }
  });

  configureRoomEvents(room);

  await room.connect(
    credentials.serverUrl,
    credentials.participantToken,
    {
      autoSubscribe: nextRole === 'viewer'
    }
  );

  el.roomStatus.textContent =
    roomName + ' / ' + nextRole;

  el.leaveRoomButton.disabled = false;
  save(STORAGE.lastRole, nextRole);
  el.joinPanel.open = false;

  if (nextRole === 'viewer') {
    el.remoteVideo.muted = true;
    el.remoteAudio.muted = false;
    el.remoteAudio.volume = 1;

    el.viewerWaitingText.classList.remove(
      'hidden'
    );

    el.viewerWaitingText.textContent =
      'Waiting for the controller to publish a video.';

    el.enableSoundButton.textContent =
      'Starting sound…';

    scheduleViewerPlaybackRetries();
  } else {
    setAction('Connected; choose a source');
  }

  const url = new URL(window.location.href);

  url.searchParams.set('room', roomName);

  if (nextRole === 'viewer') {
    url.searchParams.set('role', 'viewer');
  } else {
    url.searchParams.delete('role');
  }

  history.replaceState({}, '', url);
}

async function leaveRoom(options = {}) {
  const forgetRole = options.forgetRole !== false;

  clearViewerPlaybackRetries();

  await stopPublishing({
    rememberStop: forgetRole
  });

  if (room) {
    room.disconnect();
    room = null;
  }

  el.remoteVideo.srcObject = null;
  el.remoteAudio.srcObject = null;

  setRole('none');
  setServiceState('standby');

  el.connectionStatus.textContent =
    'Disconnected';

  el.roomStatus.textContent =
    'Not joined';

  el.leaveRoomButton.disabled = true;

  updateParticipantCount();

  if (forgetRole) {
    save(STORAGE.lastRole, 'none');
  }
}

function extractYoutubeId(value) {
  const source =
    String(value || '').trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(source)) {
    return source;
  }

  try {
    const url = new URL(source);

    if (
      url.hostname.includes('youtu.be')
    ) {
      return url.pathname
        .replace(/^\/+/, '')
        .slice(0, 11);
    }

    if (
      url.hostname.includes('youtube.com')
    ) {
      if (
        url.pathname.startsWith('/shorts/')
      ) {
        return url.pathname
          .split('/')[2]
          .slice(0, 11);
      }

      if (
        url.pathname.startsWith('/embed/')
      ) {
        return url.pathname
          .split('/')[2]
          .slice(0, 11);
      }

      return (
        url.searchParams.get('v') || ''
      ).slice(0, 11);
    }
  } catch (error) {
    return '';
  }

  return '';
}

function ensureYoutubePlayer() {
  if (
    youtubeReady &&
    youtubePlayer
  ) {
    return Promise.resolve(
      youtubePlayer
    );
  }

  return new Promise(
    (resolve, reject) => {
      const timeout =
        window.setTimeout(
          () => reject(
            new Error(
              'YouTube Player API did not become ready.'
            )
          ),
          12000
        );

      const check = () => {
        if (
          youtubeReady &&
          youtubePlayer
        ) {
          clearTimeout(timeout);
          resolve(youtubePlayer);
          return;
        }

        window.setTimeout(check, 100);
      };

      check();
    }
  );
}

async function loadYoutubeInPreview(
  autoplay = false
) {
  clearError();

  sourceMode = 'youtube';
  el.sourceModeSelect.value =
    'youtube';

  updateSourceMode();

  const value =
    el.youtubeUrlInput.value.trim();

  const videoId =
    extractYoutubeId(value);

  if (!videoId) {
    throw new Error(
      'Enter a valid YouTube URL or 11-character video ID.'
    );
  }

  save(
    STORAGE.youtubeUrl,
    value
  );

  pendingYoutubeVideoId =
    videoId;

  const player =
    await ensureYoutubePlayer();

  if (autoplay) {
    player.loadVideoById(
      videoId
    );

    player.setVolume(100);
    player.unMute();
    player.playVideo();
  } else {
    player.cueVideoById(
      videoId
    );
  }

  el.controllerOverlay.classList.add(
    'hidden'
  );

  el.mediaStatus.textContent =
    'YouTube source ready';

  setAction('YouTube ready');
}

window.onYouTubeIframeAPIReady = () => {
  youtubePlayer = new YT.Player(
    'youtubeControllerPlayer',
    {
      width: '100%',
      height: '100%',
      videoId:
        extractYoutubeId(
          el.youtubeUrlInput.value
        ) || '',
      playerVars: {
        autoplay: 0,
        controls: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: () => {
          youtubeReady = true;
          useYoutubeControllerAspectRatio();

          if (
            pendingYoutubeVideoId
          ) {
            youtubePlayer.cueVideoById(
              pendingYoutubeVideoId
            );
          }
        },
        onError: event => {
          showError(
            'YouTube player error: ' +
            event.data
          );
        }
      }
    }
  );
};


function setControllerPreviewAspectRatio(width, height) {
  const sourceWidth = Number(width);
  const sourceHeight = Number(height);

  if (
    !el.controllerVideoShell ||
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    return;
  }

  /*
   * Limit only extreme/corrupt metadata. Normal portrait, square,
   * 16:9, 16:10, and ultrawide videos keep their real aspect ratio.
   */
  const ratio = Math.min(
    4,
    Math.max(0.4, sourceWidth / sourceHeight)
  );

  el.controllerVideoShell.style.setProperty(
    '--controller-aspect-width',
    String(ratio)
  );

  el.controllerVideoShell.style.setProperty(
    '--controller-aspect-height',
    '1'
  );
}

function useYoutubeControllerAspectRatio() {
  setControllerPreviewAspectRatio(16, 9);
}

/*
 * Only one controller preview source may play at a time.
 * Switching to YouTube pauses the local video. Switching to Local pauses
 * the embedded YouTube player. The selected source can then be resumed with
 * the normal Play button or by publishing it.
 */
function pauseInactiveControllerSource(nextMode) {
  if (nextMode === 'youtube') {
    if (!el.controllerPreview.paused) {
      el.controllerPreview.pause();
    }

    if (el.rememberPositionInput.checked) {
      save(
        STORAGE.localPosition,
        el.controllerPreview.currentTime || 0
      );
    }

    return;
  }

  if (
    youtubeReady &&
    youtubePlayer &&
    typeof youtubePlayer.pauseVideo === 'function'
  ) {
    try {
      youtubePlayer.pauseVideo();
    } catch (error) {
      // The YouTube iframe may still be changing state. It is safe to retry
      // through the normal Pause button after the player becomes ready.
    }
  }
}

function updateSourceMode() {
  sourceMode =
    el.sourceModeSelect.value === 'youtube'
      ? 'youtube'
      : 'local';

  save(STORAGE.sourceMode, sourceMode);

  pauseInactiveControllerSource(sourceMode);

  const local = sourceMode === 'local';

  if (local) {
    setControllerPreviewAspectRatio(
      el.controllerPreview.videoWidth || 16,
      el.controllerPreview.videoHeight || 9
    );
  } else {
    useYoutubeControllerAspectRatio();
  }

  el.localPanel.classList.toggle(
    'hidden',
    !local
  );

  el.youtubePanel.classList.toggle(
    'hidden',
    local
  );

  el.controllerPreview.classList.toggle(
    'hidden',
    !local
  );

  el.youtubePreviewShell.classList.toggle(
    'hidden',
    local
  );

  el.selectedSourceTitle.textContent =
    local
      ? (
          localRecord
            ? 'Selected: Local video — ' +
              localRecord.name
            : 'Selected: Local video'
        )
      : 'Selected: YouTube in controller preview';

  el.mediaStatus.textContent =
    local
      ? (
          localRecord
            ? 'Local source ready'
            : 'Choose a local video'
        )
      : 'Load YouTube into the controller preview';

  updateControllerPublishingAvailability();
}

function openMediaDatabase() {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          'syncvid-livekit-static-media',
          1
        );

      request.onupgradeneeded = () => {
        const database = request.result;

        if (
          !database.objectStoreNames.contains(
            'media'
          )
        ) {
          database.createObjectStore(
            'media'
          );
        }
      };

      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

async function saveLocalFile(file) {
  const database =
    await openMediaDatabase();

  await new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          'media',
          'readwrite'
        );

      transaction
        .objectStore('media')
        .put(
          {
            blob: file,
            name: file.name,
            type: file.type,
            lastModified: file.lastModified,
            savedAt: Date.now()
          },
          'lastLocalFile'
        );

      transaction.oncomplete = resolve;

      transaction.onerror = () =>
        reject(transaction.error);
    }
  );

  database.close();
}

async function loadLocalFile() {
  const database =
    await openMediaDatabase();

  const result =
    await new Promise(
      (resolve, reject) => {
        const request =
          database
            .transaction(
              'media',
              'readonly'
            )
            .objectStore('media')
            .get('lastLocalFile');

        request.onsuccess = () =>
          resolve(request.result || null);

        request.onerror = () =>
          reject(request.error);
      }
    );

  database.close();

  return result;
}

function revokeLocalUrl() {
  if (localObjectUrl) {
    URL.revokeObjectURL(localObjectUrl);
    localObjectUrl = null;
  }
}

async function useLocalRecord(record) {
  if (!record || !record.blob) {
    throw new Error(
      'No saved local video was found.'
    );
  }

  localRecord = record;

  revokeLocalUrl();

  localObjectUrl =
    URL.createObjectURL(record.blob);

  el.controllerPreview.srcObject = null;
  el.controllerPreview.src =
    localObjectUrl;

  el.controllerPreview.muted = false;
  el.controllerPreview.volume = 1;
  el.controllerPreview.load();

  el.localFileDisplay.value =
    record.name +
    ' (browser hides the full PC path)';

  el.controllerOverlay.classList.add(
    'hidden'
  );

  await new Promise(
    (resolve, reject) => {
      if (
        el.controllerPreview.readyState >= 1
      ) {
        resolve();
        return;
      }

      el.controllerPreview.addEventListener(
        'loadedmetadata',
        resolve,
        { once: true }
      );

      el.controllerPreview.addEventListener(
        'error',
        () => reject(
          new Error(
            'The local video could not be loaded.'
          )
        ),
        { once: true }
      );
    }
  );

  setControllerPreviewAspectRatio(
    el.controllerPreview.videoWidth || 16,
    el.controllerPreview.videoHeight || 9
  );

  if (
    el.rememberPositionInput.checked
  ) {
    const savedPosition =
      readNumber(
        STORAGE.localPosition,
        0
      );

    if (
      savedPosition >= 0 &&
      savedPosition <
        el.controllerPreview.duration
    ) {
      el.controllerPreview.currentTime =
        savedPosition;
    }
  }

  updateSourceMode();
}

function captureVideoElement(video) {
  if (
    typeof video.captureStream ===
      'function'
  ) {
    return video.captureStream();
  }

  if (
    typeof video.mozCaptureStream ===
      'function'
  ) {
    return video.mozCaptureStream();
  }

  throw new Error(
    'This browser cannot capture a local video element. Use Chrome or Edge.'
  );
}

async function publishStream(
  stream,
  label,
  options = {}
) {
  if (
    !room ||
    role !== 'controller'
  ) {
    throw new Error(
      'Join the room as Controller first.'
    );
  }

  await stopPublishing();

  publishedStream = stream;
  publishedTracks = [];

  const preferredVideoCodec =
    options.videoCodec === 'h264'
      ? 'h264'
      : 'vp8';

  const maxVideoBitrate =
    Number.isFinite(options.maxVideoBitrate)
      ? options.maxVideoBitrate
      : 1200000;

  const maxVideoFramerate =
    Number.isFinite(options.maxVideoFramerate)
      ? options.maxVideoFramerate
      : 24;

  for (
    const mediaTrack
    of stream.getTracks()
  ) {
    preparePublishedMediaTrack(mediaTrack);

    const localTrack =
      mediaTrack.kind === 'video'
        ? new LocalVideoTrack(mediaTrack)
        : new LocalAudioTrack(mediaTrack);

    await room.localParticipant.publishTrack(
      localTrack,
      {
        name:
          mediaTrack.kind === 'video'
            ? 'controller-video'
            : 'controller-audio',
        stream: 'controller-program',
        simulcast:
          mediaTrack.kind === 'video',
        videoCodec:
          mediaTrack.kind === 'video'
            ? preferredVideoCodec
            : undefined,
        backupCodec:
          mediaTrack.kind === 'video' &&
          preferredVideoCodec === 'h264'
            ? {
                codec: 'vp8',
                encoding: {
                  maxBitrate: 900000,
                  maxFramerate: maxVideoFramerate
                }
              }
            : undefined,
        videoEncoding:
          mediaTrack.kind === 'video'
            ? {
                maxBitrate: maxVideoBitrate,
                maxFramerate: maxVideoFramerate
              }
            : undefined,
        degradationPreference:
          mediaTrack.kind === 'video'
            ? 'maintain-framerate'
            : undefined,
        dtx:
          mediaTrack.kind === 'audio'
            ? false
            : undefined
      }
    );

    publishedTracks.push(localTrack);
  }

  if (
    !publishedTracks.some(
      track =>
        track.kind === Track.Kind.Video
    )
  ) {
    throw new Error(
      'The selected source has no video track.'
    );
  }

  el.stopPublishButton.disabled = false;

  el.mediaStatus.textContent =
    'Publishing: ' + label;

  setAction('Broadcast active');
  save(STORAGE.lastWasPublishing, true);
}

async function publishLocalVideo() {
  selectControllerMenu('playback');

  if (!localRecord) {
    throw new Error(
      'Choose or restore a local video first.'
    );
  }

  el.controllerPreview.muted = false;
  el.controllerPreview.volume = 1;

  const playPromise =
    el.controllerPreview.play();

  const stream =
    captureVideoElement(
      el.controllerPreview
    );

  await playPromise;

  await publishStream(
    stream,
    localRecord.name,
    {
      videoCodec: 'vp8',
      maxVideoBitrate: 1200000,
      maxVideoFramerate: 24
    }
  );

  startPositionSaver();
}

async function publishYoutubeTab() {
  selectControllerMenu('playback');

  if (!canPublishYoutubeFromThisDevice()) {
    throw new Error(
      'Publish YouTube from the PC Controller. Android tablets are Viewer-only for YouTube.'
    );
  }

  /*
   * YouTube is cross-origin, so the iframe cannot use captureStream().
   * Load and play it inside this SyncVid page, then share the current tab.
   */
  await loadYoutubeInPreview(true);

  setAction(
    'Select this SyncVid tab and enable Share tab audio…'
  );

  const stream =
    await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: {
          ideal: 1280,
          max: 1280
        },
        height: {
          ideal: 720,
          max: 720
        },
        frameRate: {
          ideal: 20,
          max: 20
        }
      },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'include'
    });

  stream.getTracks().forEach(preparePublishedMediaTrack);

  const sharedVideoTrack =
    stream.getVideoTracks()[0];

  if (sharedVideoTrack) {
    try {
      await sharedVideoTrack.applyConstraints({
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
        frameRate: { ideal: 20, max: 20 }
      });
    } catch (error) {
      // The browser may already have selected the closest supported format.
    }
  }

  if (
    stream.getVideoTracks().length === 0
  ) {
    stream
      .getTracks()
      .forEach(track => track.stop());

    throw new Error(
      'No browser-tab video track was selected.'
    );
  }

  await publishStream(
    stream,
    stream.getAudioTracks().length > 0
      ? 'Embedded YouTube with audio'
      : 'Embedded YouTube without audio',
    {
      // H.264 is generally easier for older Android tablets to decode.
      // VP8 remains available as a LiveKit backup codec.
      videoCodec: 'h264',
      maxVideoBitrate: 1400000,
      maxVideoFramerate: 20
    }
  );

  if (
    stream.getAudioTracks().length === 0
  ) {
    showError(
      'YouTube is publishing without sound. Publish again, select this SyncVid tab, and enable Share tab audio.'
    );
  }
}


async function publishSelected() {
  clearError();

  if (role !== 'controller') {
    return;
  }

  if (
    sourceMode === 'youtube' &&
    !canPublishYoutubeFromThisDevice()
  ) {
    setAction('Use the PC Controller to publish YouTube');
    el.mediaStatus.textContent =
      'Tablet is ready as Viewer; YouTube publishing stays on the PC';
    updateControllerPublishingAvailability();
    return;
  }

  try {
    requireAllowedSchedule();
  } catch (error) {
    showError(error.message);
    setAction('Blocked by schedule');
    return;
  }

  publishBusy = true;
  updateControllerPublishingAvailability();

  try {
    if (sourceMode === 'youtube') {
      setAction(
        'Choose the YouTube tab and enable tab audio…'
      );

      await publishYoutubeTab();
    } else {
      setAction(
        'Starting local video…'
      );

      await publishLocalVideo();
    }
  } catch (error) {
    setAction('Publish failed');
    showError(error.message);
  } finally {
    publishBusy = false;
    updateControllerPublishingAvailability();
  }
}

async function stopPublishing(options = {}) {
  const rememberStop = options.rememberStop !== false;

  stopPositionSaver();

  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }

  if (room) {
    for (
      const localTrack
      of publishedTracks
    ) {
      try {
        await room.localParticipant
          .unpublishTrack(
            localTrack,
            true
          );
      } catch (error) {
        // Already unpublished.
      }
    }
  }

  publishedTracks = [];

  if (publishedStream) {
    publishedStream
      .getTracks()
      .forEach(track => {
        try {
          track.stop();
        } catch (error) {
          // Already stopped.
        }
      });
  }

  publishedStream = null;

  el.stopPublishButton.disabled =
    true;

  if (rememberStop) {
    save(STORAGE.lastWasPublishing, false);
  }

  if (role === 'controller') {
    el.mediaStatus.textContent =
      'No active publication';

    setAction('Ready');
  }
}

function startPositionSaver() {
  stopPositionSaver();

  positionTimer = setInterval(
    () => {
      if (
        el.rememberPositionInput.checked
      ) {
        save(
          STORAGE.localPosition,
          el.controllerPreview
            .currentTime || 0
        );
      }
    },
    1000
  );
}

function stopPositionSaver() {
  if (positionTimer) {
    clearInterval(positionTimer);
    positionTimer = null;
  }
}

async function restartLoop() {
  if (
    loopRestarting ||
    !el.loopInput.checked ||
    sourceMode !== 'local' ||
    !scheduleState().allowed
  ) {
    return;
  }

  loopRestarting = true;

  const waitSeconds =
    Math.min(
      60,
      Math.max(
        0,
        Number(
          el.loopDelayInput.value
        ) || 0
      )
    );

  el.controllerPreview.pause();

  el.mediaStatus.textContent =
    'Looping in ' +
    waitSeconds.toFixed(1) +
    ' second(s)';

  loopTimer = setTimeout(
    async () => {
      loopTimer = null;

      try {
        el.controllerPreview.currentTime = 0;

        await el.controllerPreview.play();

        /*
         * If captureStream tracks ended, republish a fresh stream through
         * LiveKit so every viewer receives the next loop.
         */
        const tracksLive =
          publishedStream &&
          publishedStream
            .getTracks()
            .some(track =>
              track.kind === 'video' &&
              track.readyState === 'live'
            );

        if (
          publishedTracks.length > 0 &&
          !tracksLive
        ) {
          const freshStream =
            captureVideoElement(
              el.controllerPreview
            );

          await publishStream(
            freshStream,
            localRecord.name,
            {
              videoCodec: 'vp8',
              maxVideoBitrate: 1200000,
              maxVideoFramerate: 24
            }
          );
        }

        el.mediaStatus.textContent =
          publishedTracks.length
            ? 'Publishing: ' +
              localRecord.name
            : 'Local video playing';
      } catch (error) {
        showError(
          'Local loop restart failed: ' +
          error.message
        );
      } finally {
        loopRestarting = false;
      }
    },
    waitSeconds * 1000
  );
}

function handleLocalTimeUpdate() {
  if (
    sourceMode !== 'local' ||
    !el.loopInput.checked ||
    loopRestarting
  ) {
    return;
  }

  const duration =
    Number(
      el.controllerPreview.duration
    ) || 0;

  const current =
    Number(
      el.controllerPreview.currentTime
    ) || 0;

  if (
    duration > 0 &&
    current > 0 &&
    duration - current <= 0.4
  ) {
    restartLoop();
  }
}

async function restoreSavedLocalVideo() {
  if (localRecord) return true;

  const record = await loadLocalFile();

  if (!record) return false;

  await useLocalRecord(record);
  return true;
}

async function resumeControllerForSchedule() {
  if (
    !room ||
    role !== 'controller' ||
    !readBoolean(STORAGE.lastWasPublishing, true)
  ) {
    return;
  }

  if (sourceMode === 'local') {
    const restored = await restoreSavedLocalVideo();

    if (!restored) {
      setAction('Choose a local video');
      el.mediaStatus.textContent =
        'No saved local video to resume';
      return;
    }

    if (publishedTracks.length === 0) {
      await publishLocalVideo();
    } else {
      await el.controllerPreview.play();
    }

    return;
  }

  await loadYoutubeInPreview(true);
  el.mediaStatus.textContent =
    'YouTube restored; tab-sharing approval is required';
  setAction('Click Publish YouTube to share the tab');
}

async function enforcePlaybackSchedule(force = false) {
  const state = updateScheduleStatus();

  if (
    scheduleTransitionBusy ||
    (!force && scheduleLastAllowed === state.allowed)
  ) {
    return;
  }

  scheduleLastAllowed = state.allowed;

  if (!room || role !== 'controller') {
    return;
  }

  scheduleTransitionBusy = true;

  try {
    if (!state.allowed) {
      if (sourceMode === 'youtube') {
        if (youtubeReady && youtubePlayer) {
          youtubePlayer.pauseVideo();
        }
      } else {
        el.controllerPreview.pause();
      }

      await stopPublishing({ rememberStop: false });
      el.mediaStatus.textContent =
        'Stopped by playback schedule';
      setAction('Waiting for allowed time');
      return;
    }

    await resumeControllerForSchedule();
  } catch (error) {
    showError(
      'Automatic schedule resume failed: ' +
      error.message
    );
    setAction('Click Play or Publish to continue');
  } finally {
    scheduleTransitionBusy = false;
  }
}

async function restoreLastSession(savedRole) {
  try {
    el.connectionStatus.textContent =
      'Restoring last session…';

    await joinRoom(savedRole);

    if (savedRole === 'viewer') {
      await attemptViewerPlayback();
      return;
    }

    if (sourceMode === 'local') {
      await restoreSavedLocalVideo();
    } else {
      await loadYoutubeInPreview(false);
    }

    await enforcePlaybackSchedule(true);
  } catch (error) {
    showError(
      'Could not restore the last session: ' +
      error.message
    );
    el.connectionStatus.textContent =
      'Automatic restore failed';
  }
}

function formatTime(value) {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return '00:00';
  }

  const total = Math.floor(value);
  const hours =
    Math.floor(total / 3600);

  const minutes =
    Math.floor(
      (total % 3600) / 60
    );

  const seconds =
    total % 60;

  if (hours > 0) {
    return [
      hours,
      minutes,
      seconds
    ]
      .map(number =>
        String(number).padStart(2, '0')
      )
      .join(':');
  }

  return (
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0')
  );
}

function updatePlaybackUi() {
  const duration =
    Number(
      el.controllerPreview.duration
    ) || 0;

  const current =
    Number(
      el.controllerPreview.currentTime
    ) || 0;

  if (duration > 0) {
    el.seekBar.value =
      String(
        Math.round(
          current /
          duration *
          1000
        )
      );
  }

  el.timeDisplay.textContent =
    formatTime(current) +
    ' / ' +
    formatTime(duration);
}

async function attemptViewerPlayback() {
  if (role !== 'viewer') {
    return false;
  }

  /*
   * Keep video muted so it can start immediately on Android. LiveKit audio is
   * attached to the separate audio element and resumed independently.
   */
  el.remoteVideo.autoplay = true;
  el.remoteVideo.muted = true;
  el.remoteVideo.playsInline = true;

  try {
    await el.remoteVideo.play();
  } catch (error) {
    // Video will be retried when the track or page becomes active again.
  }

  el.remoteAudio.autoplay = true;
  el.remoteAudio.muted = false;
  el.remoteAudio.volume = 1;

  try {
    if (room) {
      await room.startAudio();
    }

    await el.remoteAudio.play();

    const started =
      !el.remoteAudio.paused ||
      (room && room.canPlaybackAudio);

    el.enableSoundButton.textContent =
      started
        ? 'Sound ON — 100%'
        : 'Enable sound';

    return Boolean(started);
  } catch (error) {
    el.enableSoundButton.textContent =
      'Enable sound';

    return false;
  }
}

function clearViewerPlaybackRetries() {
  for (const timer of viewerPlaybackRetryTimers) {
    clearTimeout(timer);
  }

  viewerPlaybackRetryTimers = [];
}

function scheduleViewerPlaybackRetries() {
  if (role !== 'viewer') return;

  clearViewerPlaybackRetries();

  const delays = [
    0,
    150,
    400,
    800,
    1500,
    3000,
    6000,
    10000
  ];

  viewerPlaybackRetryTimers =
    delays.map(delay =>
      window.setTimeout(
        () => {
          attemptViewerPlayback()
            .catch(() => {
              // A later retry or real user touch can unlock audio.
            });
        },
        delay
      )
    );
}

function installViewerPlaybackRecovery() {
  if (window.__syncVidViewerPlaybackRecovery) {
    return;
  }

  window.__syncVidViewerPlaybackRecovery = true;

  const retry = () => {
    if (role === 'viewer') {
      scheduleViewerPlaybackRetries();
    }
  };

  window.addEventListener('pageshow', retry);
  window.addEventListener('focus', retry);
  window.addEventListener('online', retry);

  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) retry();
    }
  );

  /*
   * A real touch anywhere on the tablet supplies the browser user gesture
   * required by some Android WebView versions. The existing small sound button
   * remains available, but closing and reopening the page is no longer needed.
   */
  for (const eventName of [
    'pointerdown',
    'touchend',
    'click'
  ]) {
    document.addEventListener(
      eventName,
      retry,
      { passive: true }
    );
  }
}

window.syncVidStartViewerMedia = async () => {
  if (role !== 'viewer') {
    return false;
  }

  scheduleViewerPlaybackRetries();
  return attemptViewerPlayback();
};

async function enableViewerSound() {
  clearError();

  try {
    if (room) {
      await room.startAudio();
    }

    el.remoteVideo.muted = true;
    el.remoteAudio.muted = false;
    el.remoteAudio.volume = 1;

    await Promise.allSettled([
      el.remoteVideo.play(),
      el.remoteAudio.play()
    ]);

    if (el.remoteAudio.paused) {
      throw new Error(
        'The browser still blocked audio playback.'
      );
    }

    el.enableSoundButton.textContent =
      'Sound ON — 100%';

    clearViewerPlaybackRetries();
  } catch (error) {
    el.enableSoundButton.textContent =
      'Enable sound';

    showError(
      'Sound could not start: ' +
      error.message
    );
  }
}

function viewerLink() {
  const url =
    new URL(window.location.href);

  ['v', 'version', 'build', 'refresh'].forEach(name =>
    url.searchParams.delete(name)
  );

  url.searchParams.set(
    'room',
    el.roomInput.value.trim()
  );

  url.searchParams.set(
    'role',
    'viewer'
  );

  const tokenServerId =
    normalizeTokenServerId(
      el.tokenServerInput.value
    );

  /*
   * The LiveKit Cloud token-server ID is a public frontend identifier,
   * not the LiveKit API secret.
   */
  url.searchParams.set(
    'tokenServer',
    tokenServerId
  );

  return url.toString();
}

async function copyViewerLink() {
  const link = viewerLink();

  try {
    await navigator.clipboard
      .writeText(link);

    el.roomStatus.textContent =
      'Viewer link copied';
  } catch (error) {
    window.prompt(
      'Copy this viewer link:',
      link
    );
  }
}

el.joinViewerButton.addEventListener(
  'click',
  () => joinRoom('viewer')
    .catch(error =>
      showError(error.message)
    )
);

el.joinControllerButton.addEventListener(
  'click',
  () => joinRoom('controller')
    .catch(error =>
      showError(error.message)
    )
);

el.leaveRoomButton.addEventListener(
  'click',
  () => leaveRoom()
    .catch(error =>
      showError(error.message)
    )
);

el.copyViewerLinkButton.addEventListener(
  'click',
  copyViewerLink
);

el.autoRestoreInput.addEventListener(
  'change',
  () => save(
    STORAGE.autoRestore,
    el.autoRestoreInput.checked
  )
);

[
  el.joinPanel,
  el.controllerSourceSection,
  el.controllerScheduleSection,
  el.connectionPanel
].forEach(detailsElement => {
  detailsElement.addEventListener(
    'toggle',
    savePanelStates
  );
});

el.sourceModeSelect.addEventListener(
  'change',
  updateSourceMode
);

el.localFileInput.addEventListener(
  'change',
  async () => {
    const file =
      el.localFileInput.files[0];

    if (!file) return;

    clearError();

    try {
      await saveLocalFile(file);

      await useLocalRecord({
        blob: file,
        name: file.name,
        type: file.type,
        lastModified:
          file.lastModified,
        savedAt: Date.now()
      });
    } catch (error) {
      showError(
        'Could not load local video: ' +
        error.message
      );
    }
  }
);

el.restoreLocalButton.addEventListener(
  'click',
  async () => {
    clearError();

    try {
      const record =
        await loadLocalFile();

      if (!record) {
        throw new Error(
          'No saved local video exists in this browser.'
        );
      }

      await useLocalRecord(record);
    } catch (error) {
      showError(error.message);
    }
  }
);

el.loadYoutubeButton.addEventListener(
  'click',
  () => {
    loadYoutubeInPreview(false)
      .catch(error =>
        showError(error.message)
      );
  }
);

el.publishSelectedButton.addEventListener(
  'click',
  publishSelected
);

el.stopPublishButton.addEventListener(
  'click',
  () => stopPublishing()
    .catch(error =>
      showError(error.message)
    )
);

el.playButton.addEventListener(
  'click',
  () => {
    clearError();

    try {
      requireAllowedSchedule();
    } catch (error) {
      showError(error.message);
      return;
    }

    if (sourceMode === 'youtube') {
      if (
        youtubeReady &&
        youtubePlayer
      ) {
        youtubePlayer.setVolume(100);
        youtubePlayer.unMute();
        youtubePlayer.playVideo();
      }

      return;
    }

    el.controllerPreview
      .play()
      .catch(error =>
        showError(error.message)
      );
  }
);

el.pauseButton.addEventListener(
  'click',
  () => {
    if (sourceMode === 'youtube') {
      if (
        youtubeReady &&
        youtubePlayer
      ) {
        youtubePlayer.pauseVideo();
      }

      return;
    }

    el.controllerPreview.pause();
  }
);

el.restartButton.addEventListener(
  'click',
  () => {
    clearError();

    try {
      requireAllowedSchedule();
    } catch (error) {
      showError(error.message);
      return;
    }

    if (sourceMode === 'youtube') {
      if (
        youtubeReady &&
        youtubePlayer
      ) {
        youtubePlayer.seekTo(
          0,
          true
        );
        youtubePlayer.playVideo();
      }

      return;
    }

    el.controllerPreview.currentTime = 0;

    el.controllerPreview
      .play()
      .catch(error =>
        showError(error.message)
      );
  }
);

el.seekBar.addEventListener(
  'change',
  () => {
    const duration =
      Number(
        el.controllerPreview.duration
      ) || 0;

    if (duration > 0) {
      el.controllerPreview.currentTime =
        duration *
        Number(el.seekBar.value) /
        1000;
    }
  }
);

el.loopInput.addEventListener(
  'change',
  () => save(
    STORAGE.loopEnabled,
    el.loopInput.checked
  )
);

el.loopDelayInput.addEventListener(
  'change',
  () => save(
    STORAGE.loopDelay,
    el.loopDelayInput.value
  )
);

el.rememberPositionInput.addEventListener(
  'change',
  () => save(
    STORAGE.rememberPosition,
    el.rememberPositionInput.checked
  )
);

[
  el.scheduleEnabledInput,
  el.scheduleTimeZoneInput,
  el.scheduleStartInput,
  el.scheduleEndInput,
  el.scheduleSaturdayInput,
  el.scheduleSundayInput
].forEach(input => {
  input.addEventListener(
    'change',
    () => {
      saveScheduleSettings();
      scheduleLastAllowed = null;
      enforcePlaybackSchedule(true)
        .catch(error =>
          showError(error.message)
        );
    }
  );
});

el.controllerPreview.addEventListener(
  'timeupdate',
  handleLocalTimeUpdate
);

el.controllerPreview.addEventListener(
  'ended',
  restartLoop
);

el.enableSoundButton.addEventListener(
  'click',
  enableViewerSound
);

window.addEventListener(
  'beforeunload',
  () => {
    if (
      el.rememberPositionInput.checked
    ) {
      save(
        STORAGE.localPosition,
        el.controllerPreview
          .currentTime || 0
      );
    }

    if (room) {
      room.disconnect();
    }

    revokeLocalUrl();
  }
);

function initializeApplication() {
  if (applicationInitialized) return;
  applicationInitialized = true;
  cleanLegacyBrowserCaches();
  save(STORAGE.currentBuild, '35');
  if (!window.LivekitClient) {
    showError(
      'The LiveKit browser SDK could not be loaded.'
    );
    return;
  }

  installViewerPlaybackRecovery();

  el.remoteVideo.preload = 'auto';
  el.remoteAudio.preload = 'auto';
  el.remoteVideo.playsInline = true;
  el.remoteVideo.addEventListener('loadedmetadata', updateViewerVideoFit);
  el.remoteVideo.addEventListener('resize', updateViewerVideoFit);
  el.controllerPreview.preload = 'auto';
  el.controllerPreview.addEventListener(
    'loadedmetadata',
    () => setControllerPreviewAspectRatio(
      el.controllerPreview.videoWidth || 16,
      el.controllerPreview.videoHeight || 9
    )
  );
  el.controllerPreview.addEventListener(
    'resize',
    () => setControllerPreviewAspectRatio(
      el.controllerPreview.videoWidth || 16,
      el.controllerPreview.videoHeight || 9
    )
  );

  const params =
    new URLSearchParams(
      window.location.search
    );

  el.roomInput.value =
    params.get('room') ||
    localStorage.getItem(
      STORAGE.room
    ) ||
    'main-room';

  el.tokenServerInput.value =
    params.get('tokenServer') ||
    localStorage.getItem(
      STORAGE.tokenServerId
    ) ||
    'syncvideocgs-2gke1g';

  if (el.tokenServerInput.value) {
    save(
      STORAGE.tokenServerId,
      el.tokenServerInput.value
    );
  }

  el.youtubeUrlInput.value =
    localStorage.getItem(
      STORAGE.youtubeUrl
    ) ||
    'https://www.youtube.com/watch?v=5gEKxnUhZ18';

  sourceMode =
    localStorage.getItem(
      STORAGE.sourceMode
    ) === 'youtube'
      ? 'youtube'
      : 'local';

  el.sourceModeSelect.value =
    sourceMode;

  el.loopInput.checked =
    readBoolean(
      STORAGE.loopEnabled,
      true
    );

  el.loopDelayInput.value =
    readNumber(
      STORAGE.loopDelay,
      0
    ).toFixed(1);

  el.rememberPositionInput.checked =
    readBoolean(
      STORAGE.rememberPosition,
      true
    );

  el.autoRestoreInput.checked =
    readBoolean(
      STORAGE.autoRestore,
      true
    );

  el.scheduleEnabledInput.checked =
    readBoolean(
      STORAGE.scheduleEnabled,
      true
    );

  el.scheduleTimeZoneInput.value =
    readString(
      STORAGE.scheduleTimeZone,
      'Asia/Seoul'
    );

  el.scheduleStartInput.value =
    readString(
      STORAGE.scheduleStart,
      '09:00'
    );

  el.scheduleEndInput.value =
    readString(
      STORAGE.scheduleEnd,
      '19:00'
    );

  el.scheduleSaturdayInput.checked =
    readBoolean(
      STORAGE.scheduleSaturday,
      false
    );

  el.scheduleSundayInput.checked =
    readBoolean(
      STORAGE.scheduleSunday,
      false
    );

  el.joinPanel.open =
    readBoolean(STORAGE.joinOpen, true);
  el.controllerSourceSection.open =
    readBoolean(STORAGE.sourceOpen, true);
  el.controllerScheduleSection.open =
    readBoolean(STORAGE.scheduleOpen, false);
  el.connectionPanel.open =
    readBoolean(STORAGE.connectionOpen, false);

  setRole('none');
  setServiceState('standby');
  updateSourceMode();
  savePanelStates();

  setInterval(
    updatePlaybackUi,
    500
  );

  updateScheduleStatus();

  setInterval(
    () => enforcePlaybackSchedule(false)
      .catch(error =>
        showError(error.message)
      ),
    10000
  );

  const urlRole =
    params.get('role');

  const savedRole =
    readString(
      STORAGE.lastRole,
      'none'
    );

  const desktopControllerMode =
    params.get('desktop') === 'controller';

  if (desktopControllerMode) {
    el.autoRestoreInput.checked = true;
    save(STORAGE.autoRestore, true);
    save(STORAGE.lastRole, 'controller');
  }

  const roleToRestore =
    desktopControllerMode
      ? 'controller'
      : (
          (urlRole === 'viewer' ||
           urlRole === 'controller')
            ? urlRole
            : (
                el.autoRestoreInput.checked &&
                (savedRole === 'viewer' ||
                 savedRole === 'controller')
                  ? savedRole
                  : 'none'
              )
        );

  if (roleToRestore !== 'none') {
    restoreLastSession(roleToRestore);
  }

  window.setTimeout(() => applyInterfaceLanguage(currentLanguage), 0);
}


function sha256Fallback(value) {
  // Pure JavaScript SHA-256 fallback for older Android WebView versions
  // where window.crypto.subtle or TextEncoder is unavailable.
  const bytes = [];
  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    let codePoint = text.charCodeAt(index);

    if (
      codePoint >= 0xD800 &&
      codePoint <= 0xDBFF &&
      index + 1 < text.length
    ) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        codePoint =
          0x10000 +
          ((codePoint - 0xD800) << 10) +
          (next - 0xDC00);
        index += 1;
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(
        0xC0 | (codePoint >> 6),
        0x80 | (codePoint & 0x3F)
      );
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xE0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3F),
        0x80 | (codePoint & 0x3F)
      );
    } else {
      bytes.push(
        0xF0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3F),
        0x80 | ((codePoint >> 6) & 0x3F),
        0x80 | (codePoint & 0x3F)
      );
    }
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);

  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;

  for (let shift = 24; shift >= 0; shift -= 8) {
    bytes.push((high >>> shift) & 0xFF);
  }
  for (let shift = 24; shift >= 0; shift -= 8) {
    bytes.push((low >>> shift) & 0xFF);
  }

  const constants = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
    0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
    0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
    0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
    0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
    0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
  ];

  const state = [
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
  ];

  const rotateRight = (value32, amount) =>
    (value32 >>> amount) | (value32 << (32 - amount));

  const words = new Uint32Array(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const base = offset + index * 4;
      words[index] = (
        (bytes[base] << 24) |
        (bytes[base + 1] << 16) |
        (bytes[base + 2] << 8) |
        bytes[base + 3]
      ) >>> 0;
    }

    for (let index = 16; index < 64; index += 1) {
      const s0 = (
        rotateRight(words[index - 15], 7) ^
        rotateRight(words[index - 15], 18) ^
        (words[index - 15] >>> 3)
      ) >>> 0;
      const s1 = (
        rotateRight(words[index - 2], 17) ^
        rotateRight(words[index - 2], 19) ^
        (words[index - 2] >>> 10)
      ) >>> 0;

      words[index] = (
        words[index - 16] +
        s0 +
        words[index - 7] +
        s1
      ) >>> 0;
    }

    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    let e = state[4];
    let f = state[5];
    let g = state[6];
    let h = state[7];

    for (let index = 0; index < 64; index += 1) {
      const upperSigma1 = (
        rotateRight(e, 6) ^
        rotateRight(e, 11) ^
        rotateRight(e, 25)
      ) >>> 0;
      const choose = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (
        h +
        upperSigma1 +
        choose +
        constants[index] +
        words[index]
      ) >>> 0;
      const upperSigma0 = (
        rotateRight(a, 2) ^
        rotateRight(a, 13) ^
        rotateRight(a, 22)
      ) >>> 0;
      const majority = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (upperSigma0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    state[0] = (state[0] + a) >>> 0;
    state[1] = (state[1] + b) >>> 0;
    state[2] = (state[2] + c) >>> 0;
    state[3] = (state[3] + d) >>> 0;
    state[4] = (state[4] + e) >>> 0;
    state[5] = (state[5] + f) >>> 0;
    state[6] = (state[6] + g) >>> 0;
    state[7] = (state[7] + h) >>> 0;
  }

  return state
    .map(word => word.toString(16).padStart(8, '0'))
    .join('');
}

async function sha256Hex(value) {
  try {
    if (
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.digest === 'function' &&
      typeof window.TextEncoder === 'function'
    ) {
      const data = new TextEncoder().encode(String(value));
      const digest = await window.crypto.subtle.digest('SHA-256', data);

      return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (error) {
    // Continue with the Android WebView-compatible implementation below.
  }

  return sha256Fallback(value);
}

function getConfiguredPasswordHash() {
  try {
    const savedHash = localStorage.getItem(
      ACCESS_PASSWORD_STORAGE_KEY
    );

    if (/^[a-f0-9]{64}$/i.test(savedHash || '')) {
      return savedHash.toLowerCase();
    }
  } catch (error) {
    // Use the default password when browser storage is unavailable.
  }

  return ACCESS_DEFAULT_PASSWORD_SHA256;
}

function clearChangePasswordMessages() {
  el.changePasswordError.textContent = '';
  el.changePasswordSuccess.textContent = '';
  el.changePasswordError.classList.add('hidden');
  el.changePasswordSuccess.classList.add('hidden');
}

function openPasswordModal() {
  clearChangePasswordMessages();
  el.changePasswordForm.reset();
  el.passwordModal.classList.remove('hidden');
  el.passwordModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  window.setTimeout(() => el.currentPasswordInput.focus(), 0);
}

function closePasswordModal() {
  el.passwordModal.classList.add('hidden');
  el.passwordModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  el.changePasswordForm.reset();
  clearChangePasswordMessages();
}

async function submitPasswordChange(event) {
  event.preventDefault();
  clearChangePasswordMessages();

  const currentPassword = el.currentPasswordInput.value;
  const newPassword = el.newPasswordInput.value;
  const confirmPassword = el.confirmPasswordInput.value;

  if (newPassword.length < 4) {
    el.changePasswordError.textContent =
      'The new password must contain at least 4 characters.';
    el.changePasswordError.classList.remove('hidden');
    el.newPasswordInput.focus();
    return;
  }

  if (newPassword !== confirmPassword) {
    el.changePasswordError.textContent =
      'The new password confirmation does not match.';
    el.changePasswordError.classList.remove('hidden');
    el.confirmPasswordInput.select();
    return;
  }

  try {
    const currentHash = await sha256Hex(currentPassword);

    if (currentHash !== getConfiguredPasswordHash()) {
      el.changePasswordError.textContent =
        'The current password is incorrect.';
      el.changePasswordError.classList.remove('hidden');
      el.currentPasswordInput.select();
      return;
    }

    const newHash = await sha256Hex(newPassword);
    localStorage.setItem(ACCESS_PASSWORD_STORAGE_KEY, newHash);

    el.changePasswordSuccess.textContent =
      'Password changed. Sign in again with the new password.';
    el.changePasswordSuccess.classList.remove('hidden');

    window.setTimeout(() => {
      closePasswordModal();
      lockApplication();
    }, 900);
  } catch (error) {
    el.changePasswordError.textContent =
      'The password could not be saved in this browser.';
    el.changePasswordError.classList.remove('hidden');
  }
}

function unlockApplication() {
  el.accessGate.classList.add('hidden');
  el.appRoot.classList.remove('access-hidden');
  el.accessPasswordInput.value = '';
  el.accessError.classList.add('hidden');
  initializeApplication();
  window.setTimeout(() => applyInterfaceLanguage(currentLanguage), 0);

  // Let the Android wrapper know that the password gate has opened.
  try {
    window.dispatchEvent(new CustomEvent('syncvid:unlocked'));
  } catch (error) {
    // Older browsers can still continue without the custom event.
  }
}

function lockApplication() {
  try {
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
  } catch (error) {
    // Storage may be unavailable in private browser modes.
  }

  window.location.reload();
}

async function submitAccessPassword(event) {
  event.preventDefault();
  el.accessError.classList.add('hidden');

  try {
    const enteredHash = await sha256Hex(
      el.accessPasswordInput.value
    );

    if (enteredHash !== getConfiguredPasswordHash()) {
      el.accessPasswordInput.select();
      el.accessError.textContent = 'Incorrect password.';
      el.accessError.classList.remove('hidden');
      return;
    }

    try {
      sessionStorage.setItem(ACCESS_SESSION_KEY, 'granted');
    } catch (error) {
      // The page can still open when session storage is unavailable.
    }

    unlockApplication();
  } catch (error) {
    el.accessError.textContent =
      'This browser cannot check the password securely.';
    el.accessError.classList.remove('hidden');
  }
}

el.accessForm.addEventListener('submit', submitAccessPassword);
el.lockAccessButton.addEventListener('click', lockApplication);
el.changePasswordButton.addEventListener('click', openPasswordModal);
el.changePasswordForm.addEventListener('submit', submitPasswordChange);
el.closePasswordModalButton.addEventListener('click', closePasswordModal);
el.cancelPasswordButton.addEventListener('click', closePasswordModal);
el.passwordModal.addEventListener('click', event => {
  if (event.target.dataset.closePasswordModal === 'true') {
    closePasswordModal();
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !el.passwordModal.classList.contains('hidden')) {
    closePasswordModal();
  }
});

initializeInterfaceLanguage();

(function startPasswordGate() {
  let accessGranted = false;

  try {
    if (isDesktopControllerMode()) {
      sessionStorage.setItem(ACCESS_SESSION_KEY, 'granted');
      accessGranted = true;
    } else {
      accessGranted =
        sessionStorage.getItem(ACCESS_SESSION_KEY) === 'granted';
    }
  } catch (error) {
    accessGranted = isDesktopControllerMode();
  }

  if (accessGranted) {
    unlockApplication();
  } else {
    el.accessGate.classList.remove('hidden');
    el.appRoot.classList.add('access-hidden');
    window.setTimeout(() => el.accessPasswordInput.focus(), 0);
  }
})();
