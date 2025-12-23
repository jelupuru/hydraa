'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, MessageSquare, Plus, Reply, Edit, Trash2, User, Clock, ThumbsUp, Heart } from 'lucide-react';
import { User as UserType } from '@prisma/client';

type Comment = {
  id: number;
  content: string;
  isInternal: boolean;
  parentId: number | null;
  createdBy: UserType;
  updatedBy?: UserType;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
};

type CommentManagementProps = {
  complaintId: number;
  comments: Comment[];
  canAddComments: boolean;
  onCommentCreated: () => void;
  onCommentEdited: () => void;
  onCommentDeleted: () => void;
};

export default function CommentManagement({
  complaintId,
  comments,
  canAddComments,
  onCommentCreated,
  onCommentEdited,
  onCommentDeleted,
}: CommentManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [formData, setFormData] = useState({
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [commentsData, setCommentsData] = useState<Comment[]>(comments);
  const [replyVisibility, setReplyVisibility] = useState<{ [key: number]: boolean }>({});

  const resetForm = () => {
    setFormData({
      content: '',
    });
    setReplyingTo(null);
    setEditingComment(null);
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setCommentsData(data);
      } else {
        console.error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [complaintId]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          parentId: replyingTo?.id || null,
        }),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetForm();
        onCommentCreated();
        fetchComments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('An error occurred while creating comment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || !formData.content.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/comments/${editingComment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        resetForm();
        onCommentEdited();
        fetchComments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('An error occurred while updating comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment? This will also delete all replies.')) return;

    try {
      const response = await fetch(`/api/complaints/${complaintId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onCommentDeleted();
        fetchComments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('An error occurred while deleting comment');
    }
  };

  const openReplyDialog = (comment: Comment) => {
    setReplyingTo(comment);
    setFormData({
      content: '',
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (comment: Comment) => {
    setEditingComment(comment);
    setFormData({
      content: comment.content,
    });
    setIsEditDialogOpen(true);
  };

  const toggleReplyVisibility = (commentId: number) => {
    setReplyVisibility((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <Card key={comment.id} className={`mb-4 ${depth > 0 ? 'ml-4 border-l pl-4' : ''}`}>
      <CardHeader className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold"
        >
          {(comment.createdBy?.name?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <CardTitle className="text-sm font-semibold">
            {comment.createdBy?.name || 'Unknown'}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">
          {comment.content.length > 100 ? (
            <>
              {comment.content.slice(0, 100)}...
              <button className="text-blue-500 text-xs ml-2">see more</button>
            </>
          ) : (
            comment.content
          )}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button className="text-xs text-muted-foreground flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {/* Removed reactions as it does not exist on Comment type */}
          </button>
          <button className="text-xs text-muted-foreground flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {/* Removed reactions as it does not exist on Comment type */}
          </button>
          <button
            className="text-xs text-blue-500 flex items-center gap-1"
            onClick={() => openReplyDialog(comment)}
          >
            <Reply className="w-4 h-4" /> Reply
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCommentsTree = (comments: Comment[], depth = 0) => (
    comments.map(comment => (
      <Card className={`mb-4 ${depth > 0 ? 'ml-4 border-l pl-4' : ''}`} key={comment.id}>
        <CardHeader className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold"
          >
            {(comment.createdBy?.name?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">
              {comment.createdBy?.name || 'Unknown'}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {comment.content.length > 100 ? (
              <>
                {comment.content.slice(0, 100)}...
                <button className="text-blue-500 text-xs ml-2">see more</button>
              </>
            ) : (
              comment.content
            )}
          </p>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-2">
              {renderCommentsTree(comment.replies, depth + 1)}
            </div>
          )}
          {depth === 0 && (
            <div className="mt-4">
              <button
                className="text-xs text-blue-500"
                onClick={() => toggleReplyVisibility(comment.id)}
              >
                Reply
              </button>
              {replyVisibility[comment.id] && (
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const content = formData.get('replyContent')?.toString().trim();
                    if (!content) return;

                    try {
                      const response = await fetch(`/api/complaints/${complaintId}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          content,
                          parentId: comment.id,
                        }),
                      });

                      if (response.ok) {
                        alert('Reply added successfully');
                        fetchComments(); // Refresh comments after adding reply
                        (e.target as HTMLFormElement).reset(); // Clear the reply text box
                        toggleReplyVisibility(comment.id); // Hide reply form after submission
                      } else {
                        const error = await response.json();
                        alert(error.error || 'Failed to add reply');
                      }
                    } catch (error) {
                      console.error('Error adding reply:', error);
                      alert('An error occurred while adding reply');
                    }
                  }}
                >
                  <input
                    name="replyContent"
                    type="text"
                    placeholder="Write a reply..."
                    className="w-full border rounded p-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded text-sm"
                  >
                    Submit
                  </button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    ))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({commentsData.length})
        </h3>
        {canAddComments && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {replyingTo ? `Reply to ${replyingTo.createdBy.name}` : 'Add Comment'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateComment} className="space-y-4">
                <div>
                  <Label htmlFor="content">Comment *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={e => setFormData({ content: e.target.value })}
                    placeholder="Write your comment here..."
                    className="resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={loading}>
                    {replyingTo ? 'Reply' : 'Add Comment'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {commentsData.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        renderCommentsTree(commentsData)
      )}
    </div>
  );
}
