import { Card, Radio, Slider, Space, Switch, Tag, Tooltip, Button } from "antd";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import {
  AVAILABLE_SOUNDS,
  selectNotificationSoundState,
  setActiveSoundId,
  setEnabled,
  setVolume,
} from "../../../redux/features/notificationSound/notificationSoundSlice";
import { playNotificationSound } from "../../../utils/playNotificationSound";

const PREVIEW_FLASH_MS = 1500;

const NotificationSounds = () => {
  const dispatch = useDispatch();
  const { enabled, activeId, volume } = useSelector(
    selectNotificationSoundState
  );

  const [previewId, setPreviewId] = useState<string | null>(null);
  const activeHandleRef = useRef<{ stop: () => void } | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  const stopPreview = () => {
    activeHandleRef.current?.stop();
    activeHandleRef.current = null;
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    setPreviewId(null);
  };

  const togglePreview = (id: string, file: string, name: string) => {
    if (previewId === id) {
      stopPreview();
      return;
    }
    stopPreview();
    const handle = playNotificationSound({ name, file, volume });
    if (!handle) return;
    activeHandleRef.current = handle;
    setPreviewId(id);
    previewTimeoutRef.current = window.setTimeout(() => {
      setPreviewId((current) => (current === id ? null : current));
      activeHandleRef.current = null;
      previewTimeoutRef.current = null;
    }, PREVIEW_FLASH_MS);
  };

  const volumePct = useMemo(() => Math.round(volume * 100), [volume]);

  return (
    <div>
      <PageMeta
        title="Notification Sounds - POS & Inventory Admin Panel"
        description="Choose the audio that plays when new notifications arrive"
        keywords="notification, sound, audio, POS & Inventory"
        canonicalUrl={`${window.location.origin}/settings/notification-sounds`}
        noindex={true}
      />
      <PageHeader
        title="Notification Sounds"
        subtitle="Pick the audio that plays when new notifications arrive. Stored in this browser only."
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Notification Sounds" },
        ]}
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {enabled ? (
              <Volume2 className="w-5 h-5 text-green-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <div className="font-medium">Notification sounds</div>
              <div className="text-sm text-gray-500">
                {enabled
                  ? "A sound plays when a new notification arrives."
                  : "Notifications are silent."}
              </div>
            </div>
            <Switch
              checked={enabled}
              onChange={(checked) => dispatch(setEnabled(checked))}
              className="ml-2"
            />
          </div>

          <div className="flex items-center gap-3 md:w-80">
            <span className="text-sm text-gray-500 w-16">Volume</span>
            <Slider
              className="flex-1"
              min={0}
              max={100}
              value={volumePct}
              disabled={!enabled}
              onChange={(v) => dispatch(setVolume((v as number) / 100))}
            />
            <span className="text-sm text-gray-700 w-10 text-right">
              {volumePct}%
            </span>
          </div>
        </div>
      </Card>

      <Card title="Available sounds">
        <Radio.Group
          value={activeId}
          onChange={(e) => dispatch(setActiveSoundId(e.target.value))}
          disabled={!enabled}
          className="w-full"
        >
          <Space direction="vertical" size="middle" className="w-full">
            {AVAILABLE_SOUNDS.map((sound) => {
              const isActive = sound.id === activeId;
              const isPlaying = previewId === sound.id;
              return (
                <div
                  key={sound.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300"
                >
                  <Radio value={sound.id}>
                    <span className="font-medium">{sound.name}</span>
                  </Radio>
                  <div className="flex items-center gap-3">
                    {isActive && enabled && (
                      <Tag color="green" className="m-0">
                        Active
                      </Tag>
                    )}
                    <Tooltip title={isPlaying ? "Stop" : "Preview"}>
                      <Button
                        icon={
                          isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )
                        }
                        onClick={() =>
                          togglePreview(sound.id, sound.file, sound.name)
                        }
                      />
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </Space>
        </Radio.Group>
      </Card>
    </div>
  );
};

export default NotificationSounds;
