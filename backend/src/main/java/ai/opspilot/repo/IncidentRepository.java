package ai.opspilot.repo;

import ai.opspilot.model.Incident;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IncidentRepository extends JpaRepository<Incident, String> {
  List<Incident> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title, Pageable pageable);
  List<Incident> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
  List<Incident> findByStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(String status, String title, Pageable pageable);
  List<Incident> findAllByOrderByCreatedAtDesc(Pageable pageable);
  long countByStatus(String status);

  @Query(
      value = """
          select *
          from incidents
          where sla_overdue = false
            and due_at is not null
            and due_at < :now
            and status <> 'Resolved'
          order by due_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findSlaOverdueCandidates(@Param("now") Instant now, @Param("limit") int limit);
}
