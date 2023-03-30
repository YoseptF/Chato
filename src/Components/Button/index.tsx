import { Button } from '@blueprintjs/core';
import styled from 'styled-components';

interface StyledButtonProps {
  'use-border'?: string;
}

const StyledButton = styled(Button) <StyledButtonProps>`
color: #ececdd !important;

border: ${props => props['use-border'] === "true"
  ? '1px solid #ececdd;'
  : 'none;'
} !important;

&:hover {
      background-color: ${() => '#ecec935'};
}
`;

export default StyledButton;