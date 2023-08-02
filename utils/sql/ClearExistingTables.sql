

-- Empty energy data holder tables
    DELETE FROM [cdr-mdhe].[dbo].[AccountConcession]
    DELETE FROM [cdr-mdhe].[dbo].[PlanOverview]
    DELETE FROM [cdr-mdhe].[dbo].[Transaction]
    DELETE FROM [cdr-mdhe].[dbo].[ServicePoint]
    DELETE FROM [cdr-mdhe].[dbo].[AccountPlan]
    
    DELETE FROM [cdr-mdhe].[dbo].[Account]       
    DELETE FROM [cdr-mdhe].[dbo].[Plan] 

    DELETE FROM [cdr-mdhe].[dbo].[Organisation]    
    DELETE FROM [cdr-mdhe].[dbo].[Person]
    DELETE FROM [cdr-mdhe].[dbo].[Customer]  

-- Empty banking data holder tables

    DELETE FROM [cdr-mdh].[dbo].[Organisation]    
    DELETE FROM [cdr-mdh].[dbo].[Person]
    DELETE FROM [cdr-mdh].[dbo].[Customer]  

    DELETE FROM [cdr-mdh].[dbo].[Transaction]
    DELETE FROM [cdr-mdh].[dbo].[Account]    