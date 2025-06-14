import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Image, FileText, Mic, X } from "lucide-react";

const MessageInput = ({ disabled, receiver, onSend }) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = [
    "😀",
    "😂",
    "😍",
    "🥰",
    "😊",
    "😎",
    "🤔",
    "😢",
    "😭",
    "😡",
    "👍",
    "👎",
    "❤️",
    "🔥",
    "💯",
    "🎉",
    "👏",
    "🙌",
  ];

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() && receiver?.id) {
      try {
        if (onSend) {
          onSend(message.trim());
        }
        setMessage("");
        setAttachments([]);
        setShowEmojiPicker(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const updated = prev.filter((att) => att.id !== id);
      // Cleanup preview URLs
      const removed = prev.find((att) => att.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleVoiceRecord = () => {
    // Voice recording functionality would be implemented here
    setIsRecording(!isRecording);
  };

  return (
    <div className="message-input-container">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="attachments-preview">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              {attachment.preview ? (
                <img src={attachment.preview} alt={attachment.name} className="attachment-image" />
              ) : (
                <div className="attachment-file">
                  <FileText size={20} />
                </div>
              )}
              <div className="attachment-info">
                <span className="attachment-name">{attachment.name}</span>
                <span className="attachment-size">{formatFileSize(attachment.size)}</span>
              </div>
              <button className="remove-attachment" onClick={() => removeAttachment(attachment.id)}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <div className="emoji-grid">
            {emojis.map((emoji) => (
              <button key={emoji} className="emoji-btn" onClick={() => addEmoji(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-wrapper">
          {/* Action Buttons - Left Side */}
          <div className="input-actions-left">
            <button
              type="button"
              className="input-action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>

            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add emoji"
            >
              <Smile size={18} />
            </button>
          </div>

          {/* Text Input */}
          <div className="text-input-wrapper">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="message-textarea"
              disabled={disabled}
              rows={1}
            />
          </div>

          {/* Action Buttons - Right Side */}
          <div className="input-actions-right">
            {message.trim() || attachments.length > 0 ? (
              <button type="submit" className="send-btn" disabled={disabled} title="Send message">
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                className={`voice-btn ${isRecording ? "recording" : ""}`}
                onClick={handleVoiceRecord}
                title={isRecording ? "Stop recording" : "Record voice message"}
              >
                <Mic size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
      </form>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <span>Recording... Tap to stop</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
