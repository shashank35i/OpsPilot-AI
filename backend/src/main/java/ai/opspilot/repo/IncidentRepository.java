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
  List<Incident> findByOwnerOrderByCreatedAtDesc(String owner, Pageable pageable);
  List<Incident> findByOwnerAndStatusOrderByCreatedAtDesc(String owner, String status, Pageable pageable);
  List<Incident> findByOwnerAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(String owner, String title, Pageable pageable);
  List<Incident> findByOwnerAndStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(String owner, String status, String title, Pageable pageable);
  List<Incident> findByAssigneeOrderByCreatedAtDesc(String assignee, Pageable pageable);
  List<Incident> findBySeverityReviewStatusOrderByCreatedAtDesc(String severityReviewStatus, Pageable pageable);
  List<Incident> findByAssigneeIsNullAndStatusNotOrderByCreatedAtAsc(String status, Pageable pageable);
  long countByStatus(String status);
  long countByOwner(String owner);
  long countByOwnerAndStatus(String owner, String status);
  long countByAssignee(String assignee);
  long countByAssigneeAndStatus(String assignee, String status);
  long countByAssigneeIsNotNull();
  long countByAssigneeIsNullAndStatusNotIn(List<String> status);
  long countBySlaOverdueTrueAndStatusNotIn(List<String> status);
  long countBySeverityReviewStatus(String severityReviewStatus);

  @Query("select i.severity, count(i) from Incident i group by i.severity")
  List<Object[]> countBySeverityGroup();

  @Query("select i.category, count(i) from Incident i group by i.category")
  List<Object[]> countByCategoryGroup();

  @Query("select i.severity, count(i) from Incident i where i.owner = :owner group by i.severity")
  List<Object[]> countBySeverityForOwner(@Param("owner") String owner);

  @Query("select i.category, count(i) from Incident i where i.owner = :owner group by i.category")
  List<Object[]> countByCategoryForOwner(@Param("owner") String owner);

  @Query("select i.severity, count(i) from Incident i where i.assignee = :assignee group by i.severity")
  List<Object[]> countBySeverityForAssignee(@Param("assignee") String assignee);

  @Query(
      value = """
          select *
          from incidents
          where status not in ('Resolved', 'Closed')
            and due_at is not null
            and due_at > :now
            and timestampdiff(second, created_at, :now) >=
                (timestampdiff(second, created_at, due_at) * :thresholdPercent / 100)
          order by due_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findDashboardNearSla(@Param("now") Instant now, @Param("thresholdPercent") int thresholdPercent, @Param("limit") int limit);

  @Query(
      value = """
          select *
          from incidents
          where status not in ('Resolved', 'Closed')
            and due_at is not null
            and due_at < :now
          order by due_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findDashboardSlaBreached(@Param("now") Instant now, @Param("limit") int limit);

  @Query(
      value = """
          select *
          from incidents
          where assignee = :assignee
            and status not in ('Resolved', 'Closed')
            and due_at is not null
            and due_at < :now
          order by due_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findAssigneeSlaBreached(@Param("assignee") String assignee, @Param("now") Instant now, @Param("limit") int limit);

  @Query(
      value = """
          select *
          from incidents
          where assignee = :assignee
            and status not in ('Resolved', 'Closed')
            and due_at is not null
            and due_at > :now
            and timestampdiff(second, created_at, :now) >=
                (timestampdiff(second, created_at, due_at) * :thresholdPercent / 100)
          order by due_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findAssigneeNearSla(
      @Param("assignee") String assignee,
      @Param("now") Instant now,
      @Param("thresholdPercent") int thresholdPercent,
      @Param("limit") int limit
  );

  @Query(
      value = """
          select date(created_at) day, count(*)
          from incidents
          where created_at >= :since
          group by date(created_at)
          order by day
          """,
      nativeQuery = true
  )
  List<Object[]> incidentTrend(@Param("since") Instant since);

  @Query(
      value = """
          select avg(timestampdiff(second, created_at, resolved_at))
          from incidents
          where resolved_at is not null
          """,
      nativeQuery = true
  )
  Double averageResolutionSeconds();

  @Query(
      value = """
          select *
          from incidents
          where sla_overdue = false
            and due_at is not null
            and due_at < :now
            and status not in ('Resolved', 'Closed')
          order by due_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findSlaOverdueCandidates(@Param("now") Instant now, @Param("limit") int limit);

  @Query(
      value = """
          select *
          from incidents
          where sla_near_alerted = false
            and sla_overdue = false
            and due_at is not null
            and created_at is not null
            and due_at > :now
            and timestampdiff(second, created_at, :now) >=
                (timestampdiff(second, created_at, due_at) * :thresholdPercent / 100)
            and status <> 'Resolved'
            and status <> 'Closed'
          order by due_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findNearSlaCandidates(
      @Param("now") Instant now,
      @Param("thresholdPercent") int thresholdPercent,
      @Param("limit") int limit
  );

  @Query(
      value = """
          select *
          from incidents
          where unassigned_alerted = false
            and assignee is null
            and status not in ('Resolved', 'Closed')
            and created_at < :cutoff
          order by created_at asc
          limit :limit
          """,
      nativeQuery = true
  )
  List<Incident> findUnassignedAlertCandidates(@Param("cutoff") Instant cutoff, @Param("limit") int limit);
}
