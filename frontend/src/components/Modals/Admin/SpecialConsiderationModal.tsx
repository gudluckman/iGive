import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { auth } from '../../../util/firebase_util';
import { successNotifier, alertNotifier } from '../../Notifier/ActionNotifier';
import { SpecialConsiderationModalProps } from '../../../interfaces/modal.interface'

export function SpecialConsiderationModal({
  open,
  onClose,
  studentId,
  courseCode,
  task,
  onSuccess
}: SpecialConsiderationModalProps) {
  const [extensionHours, setExtensionHours] = useState<number>(24);
  const [reason, setReason] = useState<string>('');
  const [documentation, setDocumentation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (extensionHours <= 0) {
      setError('Extension hours must be positive');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/special_consideration/${courseCode}/${task}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentZid: studentId,
            extensionHours,
            reason,
            documentation
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add special consideration');
      }

      successNotifier(`Special consideration granted: ${extensionHours} hour extension for ${studentId}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add special consideration';
      setError(err instanceof Error ? err.message : 'An error occurred');
      alertNotifier(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setExtensionHours(24);
    setReason('');
    setDocumentation('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{
        backgroundColor: 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        Grant Special Consideration
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
            Student: {studentId}
          </Typography>
        </Box>

        <TextField
          fullWidth
          type="number"
          label="Extension Hours"
          value={extensionHours}
          onChange={(e) => setExtensionHours(Number(e.target.value))}
          sx={{ mb: 2 }}
          inputProps={{ min: 1 }}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          multiline
          rows={2}
          label="Documentation Notes (Optional)"
          value={documentation}
          onChange={(e) => setDocumentation(e.target.value)}
          helperText="Add any notes about provided documentation"
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{ minWidth: 100 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Grant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}