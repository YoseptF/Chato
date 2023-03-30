import React, { FC, useEffect, useState } from 'react';
import SourceMDEditor from '@uiw/react-md-editor';
import styled, { css } from 'styled-components';
import { Button } from '@blueprintjs/core';
import { LOCAL_STORAGE_KEY } from '../../Utils/contants';
import useReactiveLocalStorageVariable from '../../Hooks/useReactiveLocalStorageVariable';

const StyledMDEditor = styled(SourceMDEditor)`
  height: 150px !important;
  
  .w-md-editor-toolbar-divider,
  [data-name="fullscreen"] {
    display: none;
  }

  .w-md-editor-toolbar {
    height: fit-content !important;
  }

  textarea,
  .w-md-editor-toolbar,
  .w-md-editor-toolbar li.active > button {
      background-color: #40414f;
      color: white !important;
      -webkit-text-fill-color: unset;
  }

  ${(props) => props.theme.darkMode && css`
    .w-md-editor-toolbar,
    .wmde-markdown.wmde-markdown-color.w-md-editor-preview,
    td,
    th,
    textarea {
      background: #2d2d2d;
      color: #8a8a8a;
    }

    .w-md-editor-toolbar li > button {
      color: #8a8a8a;
    }

    .w-md-editor-toolbar li.active > button {
      background-color: #3d3d3d;
    }

    textarea {
      -webkit-text-fill-color: unset;
    }
  `} 
`;

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: FC<ChatInputProps> = ({
  onSend
}) => {

  const [message, setMessage] = useState('');
  
  const localStorageValue = useReactiveLocalStorageVariable(LOCAL_STORAGE_KEY);

  const sendMessage = (m: string) => {
    if(!localStorageValue) {
      alert('Please set your API key in the settings page');
      return;
    }
    if (!m) return;
    onSend(m);
    setMessage('');
  }

  return (
    <div className="container" style={{ position: "relative" }}>
      <Button
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          zIndex: 100,
          height: '78%',
          width: '5%',
          background: '#343a44',
        }}
        onClick={() => sendMessage(message)} icon="send-message" minimal
        />

      <StyledMDEditor
        value={message}
        onChange={(value) => setMessage(value || '')}
        onKeyDown={(e) => {
          // check for ctrl/cmd + enter
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            sendMessage(message);
          }
        }}
        preview="edit"
      />
    </div>
  );
};

export default ChatInput;