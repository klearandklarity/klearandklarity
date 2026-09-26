package com.klearity.guidance.repository;

import com.klearity.guidance.domain.DiscussionReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, Long> {

    List<DiscussionReply> findByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostIdAndDeletedFalse(Long postId);

    void deleteByPostId(Long postId);
}
